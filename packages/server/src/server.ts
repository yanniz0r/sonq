import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { Logger } from "tslog";
import spotify from "./libraries/spotify";
import PlaySongHandler from "./socket/handlers/play-song-handler";
import SocketController from "./socket/socket-controller";
import cors from "cors";
import { json } from "body-parser";
import GameStorage from "./storage/game-storage";
import GameRouter from "./rest/game-router";
import * as zod from "zod";
import JoinHandler from "./socket/handlers/join-handler";
import ContinueHandler from "./socket/handlers/continue-handler";
import GuessSongHandler from "./socket/handlers/guess-song-handler";
import DisconnectHandler from "./socket/handlers/disconnect-handler";
import setupGarbageCollection from "./setup-garbage-collection";

const PORT = process.env.PORT ?? 4000;
const logger = new Logger({ name: "server" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(json());

app.use(
  cors()
);

const gameStorage = new GameStorage();

const gameRouter = new GameRouter(io, gameStorage);
app.use("/game", gameRouter.router);

io.on("connection", (socket: Socket) => {
  const parsedQuery = zod
    .object({
      game: zod.string(),
      adminKey: zod.string().optional(),
    })
    .nonstrict()
    .safeParse(socket.handshake.query);
  if (!parsedQuery.success) {
    socket.disconnect();
    return;
  }
  const game = gameStorage.getGame(parsedQuery.data.game);

  if (!game) {
    logger.error("Can not find game with provided id", parsedQuery.data.game);
    socket.disconnect();
    return;
  }
  socket.join(game.id);

  const isAdmin = parsedQuery.data.adminKey === game.adminKey;

  const socketController = new SocketController(game, socket, isAdmin);
  socketController.addHandler(new PlaySongHandler());
  socketController.addHandler(new JoinHandler());
  socketController.addHandler(new ContinueHandler());
  socketController.addHandler(new GuessSongHandler());
  socketController.addHandler(new DisconnectHandler());
});

setupGarbageCollection(gameStorage);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}!`);
});
