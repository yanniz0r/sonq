import SpotifyWebApi from "spotify-web-api-node";

class Game {

  constructor(
    public id: string,
    public spotify: SpotifyWebApi
  ) {}

}

export default Game;
