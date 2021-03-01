import { GameOptions, GamePhase } from "./domain";

export interface GetGameDetails {
  phase: GamePhase;
  /**
   * A number between 0 and 1, indicating how far the playlist data has been downloaded so far
   */
  playlistDataDownloadProgress: number;
  options: GameOptions;
}
