import { SocketServer } from "@sonq/api";
import { Server } from "socket.io";
import Game from "../../models/game";

export const phaseChangeEmitter = (socket: Server, game: Game) => {
  const data: SocketServer.PhaseChangeEvent = {
    phase: game.phase, 
  }
  socket.emit(SocketServer.Events.PhaseChange, data);
}