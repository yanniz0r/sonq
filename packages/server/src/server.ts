import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { Logger } from 'tslog';
import spotify from './libraries/spotify';
import PlaySongHandler from './socket/handlers/play-song-handler';
import SocketController from './socket/socket-controller';
import cors from 'cors';
import { json } from 'body-parser';
import GameStorage from './storage/game-storage';
import GameRouter from './rest/game-router';
import * as zod from 'zod';
import JoinHandler from './socket/handlers/join-handler';

const PORT = 4000;
const logger = new Logger({ name: 'server' })

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(json());

app.use(cors({
  origin: '*'
}))

const gameStorage = new GameStorage();

const gameRouter = new GameRouter(gameStorage);
app.use(gameRouter.router)

io.on('connection', (socket: Socket) => {
  const parsedQuery = zod
    .object({
      game: zod.string()
    })
    .nonstrict()
    .safeParse(socket.handshake.query);
  if (!parsedQuery.success) {
    socket.disconnect();
    return;
  }
  const game = gameStorage.getGame(parsedQuery.data.game);
  if (!game) {
    logger.error('Can not find game with provided id', parsedQuery.data.game);
    socket.disconnect();
    return;
  }
  const socketController = new SocketController(game, socket);
  socketController.addHandler(new PlaySongHandler(spotify));
  socketController.addHandler(new JoinHandler());
})

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}!`);
})
