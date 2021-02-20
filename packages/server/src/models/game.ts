import SpotifyWebApi from "spotify-web-api-node";

export interface GameOptions {
  playlistId?: string;
}

class Game {

  public options: GameOptions = {};

  constructor(
    public id: string,
    public spotify: SpotifyWebApi
  ) {}

}

export default Game;
