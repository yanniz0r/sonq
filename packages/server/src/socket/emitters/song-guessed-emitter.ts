import { SocketServer } from "@sonq/api";
import { Server } from "socket.io";
import Player from "../../models/player";

export const songGuessedIncorrectlyEmitter = (socket: Server, player: Player, songName: string, artistName: string) => {
  const data: SocketServer.SongGuessedEvent = {
    player,
    correct: false,
    artistName,
    songName,
  };
  socket.emit(SocketServer.Events.SongGuessed, data);
};

export const songGuessedCorrectlyEmitter = (socket: Server, player: Player) => {
  const data: SocketServer.SongGuessedEvent = {
    correct: true,
    player,
  };
  socket.emit(SocketServer.Events.SongGuessed, data);
};
