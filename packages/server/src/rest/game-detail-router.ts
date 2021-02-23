import { RequestHandler, response, Router } from "express";
import { Logger } from "tslog";
import GameStorage from "../storage/game-storage";
import * as zod from 'zod';
import { Domain, Rest } from "@sonq/api";
import Game from "../models/game";

const ParamsSchema = zod.object({
  gameId: zod.string()
});

const logger = new Logger({ name: 'GameDetailLogger' });

class GameDetailRouter {

  public router = Router({ mergeParams: true });
  public game!: Game;

  constructor(private gameStorage: GameStorage) {
    this.router.use(this.gameMiddleware);
    this.router.get('/', this.get)
    this.router.get('/spotify/track', this.getSpotifyTrack)
    this.router.get('/spotify/playlist', this.getSpotifyPlaylist)
    this.router.get('/options', this.getGameOptions)
    this.router.post('/options', this.postGameOptions)
  }

  private gameMiddleware: RequestHandler = (request, response, next) => {
    const params = ParamsSchema.parse(request.params);
    const game = this.gameStorage.getGame(params.gameId);
    if (!game) {
      logger.error('Can not find game with id', params.gameId);
      response.sendStatus(404);
      return;
    } else {
      this.game = game;
      next();
    }
  }

  private get: RequestHandler = (request, response) => {
    const payload: Rest.GetGameDetails = {
      options: this.game.options,
      phase: this.game.phase,
    }
    return response.status(200).json(payload);
  }

  private postGameOptions: RequestHandler = (request, response) => {
    const body = Domain.GameOptionsSchema.parse(request.body);
    this.game.options.spotifyPlaylistId = body.spotifyPlaylistId;
    response.status(200).json(this.game.options);
  }

  private getGameOptions: RequestHandler = (request, response) => {
    response.status(200).json(this.game.options);
  }

  private getSpotifyPlaylist: RequestHandler = async (request, response) => {
    const QuerySchema = zod.object({
      query: zod.string().optional()
    });
    const query = QuerySchema.parse(request.query);
    const playlists = query.query
      ? await this.game.spotify.searchPlaylists(query.query)
      : await this.game.spotify.getFeaturedPlaylists();
    response.send(playlists.body);
  }

  private getSpotifyTrack: RequestHandler = async (request, response) => {
    const QuerySchema = zod.object({
      query: zod.string()
    });
    const query = QuerySchema.parse(request.query);

    const tracks = await this.game.spotify.searchTracks(query.query, { limit: 4 });
    response.status(200).json(tracks.body)
  }

}

export default GameDetailRouter;