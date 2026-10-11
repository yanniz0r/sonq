import { SocketServer } from "@sonq/api";
import { Server } from "socket.io";
import Game from "../../models/game";
import Player from "../../models/player";

export const playerJoinedEmitter = (
  socket: Server,
  game: Game,
  player: Player
) => {
  const data: SocketServer.PlayerJoinedEvent = {
    player,
    players: game.players,
  };
  socket.to(game.id).emit(SocketServer.Events.PlayerJoined, data);
};
