import SpotifyWebApi from "spotify-web-api-node";
import { Domain } from '@sonq/api';

class Game {

  public options: Domain.GameOptions = {};

  constructor(
    public id: string,
    public spotify: SpotifyWebApi
  ) {}

}

export default Game;
