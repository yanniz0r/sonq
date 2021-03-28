import SpotifyWebApi from "spotify-web-api-node";
import { Domain } from "@sonq/api";
import Player from "./player";
import dayjs from "dayjs";
import { makeObservable, observable, reaction, ObservableMap } from "mobx";
import { Logger } from "tslog";
import { Server } from "socket.io";
import { phaseChangeEmitter } from "../socket/emitters/phase-change-emitter";
import SpotifyPlaylistLoader from "../libraries/spotify-playlist-loader";
import { v4 } from "uuid";
import { PlayerStatistic } from "@sonq/api/dist/domain";

const logger = new Logger({ name: "Game" });

class Game {
  @observable
  public options: Domain.GameOptions = {};
  @observable
  public players: Player[] = [];
  @observable
  public phase: Domain.GamePhase = {
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  };
  @observable
  public score = new ObservableMap<Player, number>();
  public songs: SpotifyApi.TrackObjectFull[] = [];

  public guessedSongs: SpotifyApi.TrackObjectFull[] = [];
  public wrongAnswerCounter: Map<Player, number> = new ObservableMap()
  public closestCall?: PlayerStatistic;
  public fastestAnswer?: PlayerStatistic;

  public playlistLoader: SpotifyPlaylistLoader;
  public currentSong?: SpotifyApi.TrackObjectFull;
  public answers: Map<Player, Date> = new ObservableMap();
  public wrongGuesses: Domain.SongGuess[] = [];
  public phaseStarted = new Date();

  public preSongDelay = 5 * 1000;
  public playSongTime = 30 * 1000;

  public roundsLeft = 15;

  public nextPlaySongPhaseTimeout?: NodeJS.Timeout;

  public createdAt = new Date();

  /**
   * A credential that is used to control game access
   */
  public adminKey = v4();

  constructor(
    public io: Server,
    public id: string,
    public spotify: SpotifyWebApi
  ) {
    makeObservable(this);

    this.playlistLoader = new SpotifyPlaylistLoader(spotify);

    reaction(
      () => this.phase,
      () => {
        this.phaseStarted = new Date();
      }
    );

    reaction(
      () => this.phase,
      () => {
        phaseChangeEmitter(this.io, this);
      }
    );

    /**
     * React when everyone answered
     */
    reaction(
      () => this.players.length === this.answers.size,
      (everyonAnswered) => {
        if (everyonAnswered) {
          this.transitionToReviewPhase();
        }
      }
    );

    reaction(
      () => this.phase.type === Domain.GamePhaseType.PlaySong,
      (isPlaySongPhase) => {
        if (isPlaySongPhase) {
          const timeout = setTimeout(() => {
            this.transitionToReviewPhase();
          }, this.preSongDelay + this.playSongTime);
          this.nextPlaySongPhaseTimeout = timeout;
        } else {
          if (this.nextPlaySongPhaseTimeout) {
            clearTimeout(this.nextPlaySongPhaseTimeout);
          }
        }
      }
    );
  }

  public async submitAnswer(answer: {player: Player, artistName: string, songName: string, spotifyId: string}): Promise<[boolean, SpotifyApi.TrackObjectFull]> {
    if (
      this.currentSong &&
      this.currentSong.name === answer.songName &&
      answer.artistName === this.currentSong.artists[0].name
    ) {
      const timeUntilRoundEnd = dayjs(new Date()).diff(this.phaseStarted, "s");
      const answerTime = (this.playSongTime / 1000) - timeUntilRoundEnd;
      if (!this.closestCall || this.closestCall.value > timeUntilRoundEnd) {
        this.closestCall = {
          player: answer.player,
          value: timeUntilRoundEnd
        }
      }
      if (!this.fastestAnswer || this.fastestAnswer.value > answerTime) {
        this.fastestAnswer = {
          player: answer.player,
          value: answerTime,
        }
      }
      return [true, this.currentSong];
    }
    this.wrongGuesses.push({
      artistName: answer.artistName,
      songName: answer.songName,
    });
    this.addWrongAnswerToStatistic(answer.player)
    return this.spotify
      .getTrack(answer.spotifyId)
      .then((track) => {
        return [false, track.body];
      });
  }

  private addWrongAnswerToStatistic(player: Player) {
    const wrongAnswersForPlayer = this.wrongAnswerCounter.get(player);
    if (!wrongAnswersForPlayer) {
      this.wrongAnswerCounter.set(player, 1)
    } else {
      this.wrongAnswerCounter.set(player, wrongAnswersForPlayer + 1)
    }
  }

  public checkAnswer(songName: string, artistName: string) {
    if (
      this.currentSong &&
      this.currentSong.name === songName &&
      artistName === this.currentSong.artists[0].name
    ) {
      return true;
    }
    this.wrongGuesses.push({
      artistName,
      songName,
    });
    return false;
  }

  public bookPlayerPointsToScore() {
    this.answers.forEach((answerDate, player) => {
      this.score.get(player);
      let playerScore = this.score.get(player) ?? 0;
      playerScore += this.getPoints(answerDate);
      this.score.set(player, playerScore);
    });
  }

  private getPoints(date: Date) {
    return Math.round(
      Math.max(30 - dayjs(date).diff(this.phaseStarted, "s"), 5) *
        this.currentSongPopularityFactor
    );
  }

  public getReviewAnswers(): Domain.ReviewGamePhaseAnswer[] {
    const answers: Domain.ReviewGamePhaseAnswer[] = [];
    this.answers.forEach((date, player) => {
      answers.push({
        player,
        time: dayjs(date).diff(this.phaseStarted, "s"),
      });
    });
    return answers;
  }

  private getPlayerScores(): Domain.PlayerScore[] {
    const playerScores: Domain.PlayerScore[] = [];
    this.score.forEach((score, player) => {
      const answerDate = this.answers.get(player);
      const added = answerDate && this.getPoints(answerDate);

      playerScores.push({
        player,
        added,
        score,
      });
    });
    return playerScores;
  }

  private getWrongAnswersForPlayer(player: Player) {
    return this.wrongAnswerCounter.get(player) ?? 0;
  }

  public transitionToReviewPhase() {
    if (this.phase.type !== Domain.GamePhaseType.PlaySong) {
      logger.error(
        `Can not transition from ${this.phase.type} to ${Domain.GamePhaseType.Review}`
      );
      return;
    }
    this.bookPlayerPointsToScore();
    this.phase = {
      type: Domain.GamePhaseType.Review,
      data: {
        wrongGuesses: this.wrongGuesses,
        answers: this.getReviewAnswers(),
        score: this.getPlayerScores(),
        track: this.currentSong!,
        popularityBonus: this.currentSongPopularityFactor,
      },
    };
    this.answers.clear();
  }

  public hasRoundsLeft() {
    return this.roundsLeft >= 1;
  }

  public get currentSongPopularityFactor() {
    if (!this.currentSong) {
      throw new Error("No song currently selected");
    }
    return (100 - (this.currentSong.popularity - 50)) / 100;
  }

  public transitionToSummary() {
    let mostWrongAnswers: PlayerStatistic | undefined = undefined;
    let leastWrongAnswers: PlayerStatistic | undefined = undefined;
    this.players.forEach((player) => {
      const wrongAnswers = this.getWrongAnswersForPlayer(player);
      if (!mostWrongAnswers || mostWrongAnswers.value < wrongAnswers) {
        mostWrongAnswers = {
          player,
          value: wrongAnswers
        }
      }
      if (!leastWrongAnswers || leastWrongAnswers.value > wrongAnswers) {
        leastWrongAnswers = {
          player,
          value: wrongAnswers
        }
      }
    })

    this.phase = {
      type: Domain.GamePhaseType.Summary,
      data: {
        mostWrongAnswers,
        leastWrongAnswers,
        fastestAnswer: this.fastestAnswer,
        closestCall: this.closestCall,
        answers: this.getReviewAnswers(),
        songs: this.guessedSongs,
        score: this.getPlayerScores(),
        track: this.currentSong!,
      },
    };
  }

  private pickRandomSong() {
    const index = Math.floor(Math.random() * this.songs.length);
    const song = this.songs[index];
    this.songs.splice(index, 1);
    return song;
  }

  public transitionToPlayGame() {
    this.wrongGuesses = [];
    this.currentSong = this.pickRandomSong();
    this.phase = {
      type: Domain.GamePhaseType.PlaySong,
      data: {
        phaseEnd: this.preSongDelay + this.playSongTime,
        phaseStart: this.preSongDelay,
        previewUrl: this.currentSong!.preview_url!,
      },
    };
    logger.debug(
      `Playing "${this.currentSong.name}" from "${this.currentSong.artists[0].name}"`
    );
    this.guessedSongs.push(this.currentSong)
    this.roundsLeft -= 1;
    this.answers.clear();
  }
}

export default Game;
