import { Router } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import spotify from "../libraries/spotify";
import Game from "../models/game";
import GameStorage from "../storage/game-storage";

const logger = new Logger({ name: 'GameRouter' })

class GameRouter {

  public router = Router();

  constructor(gameStorage: GameStorage) {
    this.router.post('/game', async (request, response) => {
      const codeGrant = await spotify.authorizationCodeGrant(request.body.code)
      const gameSpotifyClient = new SpotifyWebApi({
        accessToken: codeGrant.body.access_token,
        refreshToken: codeGrant.body.refresh_token,
        clientId: spotify.getClientId(),
        clientSecret: spotify.getClientSecret(),
        redirectUri: spotify.getRedirectURI(),
      });
      const game = new Game(gameStorage.getId(), gameSpotifyClient);
      gameStorage.addGame(game);
      logger.debug('created game', game.id);
      response.status(200).send({
        gameId: game.id
      });
    });
  }
}

export default GameRouter;
