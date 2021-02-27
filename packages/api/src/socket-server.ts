import { GamePhase, Player } from "./domain";

export enum Events {
  /**
   * A player in the current submitted a guess
   */
  SongGuessed = "server:song-guessed",
  /**
   * The games phase has changed
   */
  PhaseChange = "server:phase-change",
  /**
   * 
   */
  PlayerJoined = "server:player-joined",

  PlayerLeft = "server:player-left"
}

export type SongGuessedEvent = {
  player: Player;
  correct: true;
} | {
  player: Player;
  correct: false;
  artistName: string;
  songName: string;
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

export interface PlayerLeftEvent {
  player: Player;
  players: Player[];
}
