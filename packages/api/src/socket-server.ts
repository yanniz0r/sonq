import { GamePhase, Player } from "./domain";

export enum Events {
  /**
   * A player in the current lobby successfully guessed the song
   */
  SongGuessed = "server:song-guessed",
  /**
   * The games phase has changed
   */
  PhaseChange = "server:phase-change",
  /**
   * 
   */
  PlayerJoined = "server:player-joined"
}

export interface SongQuessedEvent {
  player: Player;
}

export interface TimeOverUpdateEvent {
  timeOverAt: string;
}

export interface PhaseChangeEvent {
  phase: GamePhase;
}

export interface PlayerJoinedEvent {
  player: Player;
  players: Player[];
}
