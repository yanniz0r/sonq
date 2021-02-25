import SpotifyWebApi from "spotify-web-api-node";
import { Domain } from '@sonq/api';
import Player from "./player";
import dayjs from 'dayjs';
import { makeObservable, observable, reaction, ObservableMap } from 'mobx';

class Game {

  public options: Domain.GameOptions = {};
  @observable
  public players: Player[] = [];
  @observable
  public phase: Domain.GamePhase = {
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  }
  public currentSong?: SpotifyApi.TrackObjectFull;
  public answers: Map<Player, Date> = new ObservableMap();
  public phaseStarted = new Date();

  constructor(
    public id: string,
    public spotify: SpotifyWebApi
  ) {
    makeObservable(this);

    reaction(() => this.phase, () => {
      this.phaseStarted = new Date();
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

}

export default Game;
