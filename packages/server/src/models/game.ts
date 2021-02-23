import SpotifyWebApi from "spotify-web-api-node";
import { Domain } from '@sonq/api';
import Player from "./player";
import dayjs from 'dayjs';
import { Logger } from "tslog";

class Game {

  public options: Domain.GameOptions = {};
  public _phase: Domain.GamePhase = {
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  }
  public currentSong?: SpotifyApi.TrackObjectFull;
  public answers: Map<Player, Date> = new Map();
  public phaseStarted = new Date();

  constructor(
    public id: string,
    public spotify: SpotifyWebApi
  ) {}

  public get phase() {
    return this._phase;
  }

  public set phase(newPhase) {
    this.phaseStarted = new Date();
    this._phase = newPhase;
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

  public getReviewAnswers(roundStart: Date): Domain.ReviewGamePhaseAnswer[] {
    const answers: Domain.ReviewGamePhaseAnswer[] = [];
    this.answers.forEach((date, player) => {
      answers.push({
        player,
        time: dayjs(date).diff(roundStart, 's')
      })
    })
    return answers;
  }

}

export default Game;
