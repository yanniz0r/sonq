import { SocketServer } from "@sonq/api";
import Game from "../../models/game";
import Player from "../../models/player";
import { Track } from "@spotify/web-api-ts-sdk";

export const songGuessedIncorrectlyEmitter = (
  game: Game,
  player: Player,
  track: Track
) => {
  const data: SocketServer.SongGuessedEvent = {
    player,
    correct: false,
    coverImage: track.album.images[0].url,
    artistName: track.artists[0].name,
    songName: track.name,
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
