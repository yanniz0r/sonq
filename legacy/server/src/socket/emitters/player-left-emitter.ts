import { SocketServer } from "@sonq/api";
import { Server } from "socket.io";
import Game from "../../models/game";
import Player from "../../models/player";

export const playerLeftEmitter = (
  socket: Server,
  game: Game,
  player: Player
) => {
  const data: SocketServer.PlayerLeftEvent = {
    player,
    players: game.players,
  };
  socket.to(game.id).emit(SocketServer.Events.PlayerLeft, data);
};
