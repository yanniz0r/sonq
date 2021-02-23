import { GamePhase, Player } from './domain'

export enum Events {
  /**
   * A player in the current lobby successfully guessed the song
   */
  SongGuessed = 'server:song-guessed',
  /**
   * The countdown for the current round is over
   */
  TimeOver = 'server:time-over',
  /**
   * The time when the current round ends has been updated
   */
  TimeOverUpdate = 'server:time-over-update',
  /**
   * The games phase has changed
   */
  PhaseChange = 'server:phase-change'
}

export interface SongQuessedEvent {
  player: Player
}

export interface TimeOverUpdateEvent {
  timeOverAt: string;
}

export interface PhaseChangeEvent {
  phase: GamePhase;
}
