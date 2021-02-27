import { SocketServer } from "@sonq/api";
import { Server } from "socket.io";
import Game from "../../models/game";
import Player from "../../models/player";

export const songGuessedIncorrectlyEmitter = (game: Game, player: Player, songName: string, artistName: string) => {
  const data: SocketServer.SongGuessedEvent = {
    player,
    correct: false,
    artistName,
    songName,
  };
  game.io.to(game.id).emit(SocketServer.Events.SongGuessed, data);
};

export const songGuessedCorrectlyEmitter = (game: Game, player: Player) => {
  const data: SocketServer.SongGuessedEvent = {
    correct: true,
    player,
  };
  game.io.emit(SocketServer.Events.SongGuessed, data);
};
