import SpotifyWebApi from "spotify-web-api-node";
import { Domain } from '@sonq/api';
import Player from "./player";
import dayjs from 'dayjs';
import { makeObservable, observable, reaction, ObservableMap } from 'mobx';
import { Logger } from "tslog";
import { Server } from "socket.io";
import { phaseChangeEmitter } from "../socket/emitters/phase-change-emitter";

const logger = new Logger({ name: 'Game' })

class Game {

  public options: Domain.GameOptions = {};
  @observable
  public players: Player[] = [];
  @observable
  public phase: Domain.GamePhase = {
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  }
  @observable
  public score = new ObservableMap<Player, number>();

  public currentSong?: SpotifyApi.TrackObjectFull;
  public answers: Map<Player, Date> = new ObservableMap();
  public phaseStarted = new Date();

  public preSongDelay = 5 * 1000;
  public playSongTime = 30 * 1000;

  public nextPlaySongPhaseTimeout?: NodeJS.Timeout;

  constructor(
    io: Server,
    public id: string,
    public spotify: SpotifyWebApi
  ) {
    makeObservable(this);
    reaction(() => this.phase, () => {
      this.phaseStarted = new Date();
    })

    reaction(() => this.phase, () => {
      phaseChangeEmitter(io, this);
    })
  
    /**
     * React when everyone answered
     */
    reaction(() => this.players.length === this.answers.size, (everyonAnswered) => {
      if (everyonAnswered) {
        this.transitionToReviewPhase()
      }
    })
  
    reaction(() => this.phase.type === Domain.GamePhaseType.PlaySong, (isPlaySongPhase) => {
      if (isPlaySongPhase) {
        const timeout = setTimeout(() => {
          this.transitionToReviewPhase()
        }, this.preSongDelay + this.playSongTime);
        this.nextPlaySongPhaseTimeout = timeout;
      } else {
        if (this.nextPlaySongPhaseTimeout) {
          clearTimeout(this.nextPlaySongPhaseTimeout);
        }
      }
    })
  }

  public checkAnswer(songName: string, artistName: string) {
    if (!this.currentSong) {
      return false;
    }
    if (songName !== this.currentSong.name) {
      return false;
    }
    if (artistName !== this.currentSong.artists[0].name) {
      return false;
    }
    return true;
  }

  public bookPlayerPointsToScore() {
    this.answers.forEach((answerDate, player) => {
      this.score.get(player)
      let playerScore = this.score.get(player) ?? 0;
      playerScore += this.getPoints(answerDate);
      this.score.set(player, playerScore);
    });
    this.answers.clear();
  }

  private getPoints(date: Date) {
    return Math.max(30 - dayjs(date).diff(this.phaseStarted, 's'), 5)
  }

  public getReviewAnswers(): Domain.ReviewGamePhaseAnswer[] {
    const answers: Domain.ReviewGamePhaseAnswer[] = [];
    this.answers.forEach((date, player) => {
      answers.push({
        player,
        time: dayjs(date).diff(this.phaseStarted, 's')
      })
    })
    return answers;
  }

  private getPlayerScores(): Domain.PlayerScore[] {
    const playerScores: Domain.PlayerScore[] = [];
    this.score.forEach((score, player) => {
      playerScores.push({
        player,
        score
      })
    })
    return playerScores;
  }

  public transitionToReviewPhase() {
    if (this.phase.type !== Domain.GamePhaseType.PlaySong) {
      logger.error(`Can not transition from ${this.phase.type} to ${Domain.GamePhaseType.Review}`)
      return;
    }
    this.bookPlayerPointsToScore();
    this.phase = {
      type: Domain.GamePhaseType.Review,
      data: {
        answers: this.getReviewAnswers(),
        score: this.getPlayerScores(),
        track: this.currentSong!,
      }
    }
    this.answers.clear();
  }

}

export default Game;
