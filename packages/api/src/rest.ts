import { GameOptions, GamePhase } from "./domain";

export interface GetGameDetails {
  phase: GamePhase;
  options: GameOptions;
}
