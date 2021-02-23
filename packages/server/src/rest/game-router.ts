import { RequestHandler, Router } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import spotify from "../libraries/spotify";
import Game from "../models/game";
import GameStorage from "../storage/game-storage";
import GameDetailRouter from "./game-detail-router";

const logger = new Logger({ name: 'GameRouter' })

class GameRouter {

  public router = Router({ mergeParams: true });
  private gameDetailRouter: GameDetailRouter;

  constructor(private gameStorage: GameStorage) {
    this.gameDetailRouter = new GameDetailRouter(gameStorage);

    this.router.post('/', this.postGame.bind(this));
    this.router.use('/:gameId', this.gameDetailRouter.router);
  }

  private postGame: RequestHandler = async (request, response) => {
    const codeGrant = await spotify.authorizationCodeGrant(request.body.code)
    const gameSpotifyClient = new SpotifyWebApi({
      accessToken: codeGrant.body.access_token,
      refreshToken: codeGrant.body.refresh_token,
      clientId: spotify.getClientId(),
      clientSecret: spotify.getClientSecret(),
      redirectUri: spotify.getRedirectURI(),
    });
    const game = new Game(this.gameStorage.getId(), gameSpotifyClient);
    this.gameStorage.addGame(game);
    logger.debug('created game', game.id);
    response.status(200).send({
      gameId: game.id
    });
  }

  private getGame: RequestHandler = (request, response, next) => {

  }

}

export default GameRouter;
