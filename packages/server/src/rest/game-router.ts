import { Router } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import spotify from "../libraries/spotify";
import Game from "../models/game";
import GameStorage from "../storage/game-storage";
import * as zod from 'zod';
import { Domain } from "@sonq/api";

const logger = new Logger({ name: 'GameRouter' })

const ParamsSchema = zod.object({
  gameId: zod.string()
});

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

    this.router.get('/game/:gameId/spotify/playlist', async (request, response) => {
      const QuerySchema = zod.object({
        query: zod.string().optional()
      });
      const query = QuerySchema.parse(request.query);
      const params = ParamsSchema.parse(request.params);
      const game = gameStorage.getGame(params.gameId);
      if (!game) {
        logger.error('Can not find game with id', params.gameId);
        response.sendStatus(404);
        return;
      }
      const playlists = query.query
        ? await game.spotify.searchPlaylists(query.query)
        : await game.spotify.getFeaturedPlaylists();
      response.send(playlists.body);
    })

    this.router.get('/game/:gameId/options', (request, response) => {
      const params = ParamsSchema.parse(request.params);
      const game = gameStorage.getGame(params.gameId);
      if (!game) {
        logger.error('Can not find game with id', params.gameId);
        response.sendStatus(404);
        return;
      }
      response.status(200).json(game.options);
    })

    this.router.post('/game/:gameId/options', (request, response) => {
      const params = ParamsSchema.parse(request.params);
      const body = Domain.GameOptionsSchema.parse(request.body);
      const game = gameStorage.getGame(params.gameId);
      if (!game) {
        logger.error('Can not find game with id', params.gameId);
        response.sendStatus(404);
        return;
      }
      game.options.spotifyPlaylistId = body.spotifyPlaylistId;
      response.status(200).json(game.options);
    })

  }

}

export default GameRouter;
