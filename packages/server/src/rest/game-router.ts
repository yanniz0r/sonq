import { Rest } from "@sonq/api";
import { RequestHandler, Router } from "express";
import { Server } from "socket.io";
import { Logger } from "tslog";
import spotify from "../libraries/spotify";
import Game from "../models/game";
import GameStorage from "../storage/game-storage";
import GameDetailRouter from "./game-detail-router";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const logger = new Logger({ name: "GameRouter" });

class GameRouter {
  public router = Router({ mergeParams: true });
  private gameDetailRouter: GameDetailRouter;

  constructor(private io: Server, private gameStorage: GameStorage) {
    this.gameDetailRouter = new GameDetailRouter(gameStorage);

    this.router.post("/", this.postGame.bind(this));
    this.router.use("/:gameId", this.gameDetailRouter.router);
    this.router.post("/:gameId/spotify-auth", this.test);
  }

  private test: RequestHandler = async (request, response) => {
    const game = this.gameStorage.getGame(request.params.gameId);
    if (!game) return response.status(404).json({ message: "game not found" });
    game.authenticateSpotify(request.body);
    response.status(200).json({ message: "test" });
  }

  private postGame: RequestHandler = async (request, response) => {
    const game = new Game(this.io, this.gameStorage.getId());
    this.gameStorage.addGame(game);
    logger.debug("created game", game.id);
    const responseData: Rest.PostGame = {
      gameId: game.id,
      adminKey: game.adminKey,
    };
    response.status(200).json(responseData);
  };
}

export default GameRouter;
