import * as zod from "zod";

export const GameOptionsSchema = zod.object({
  spotifyPlaylistId: zod.string().optional(),
  rounds: zod.number().optional(),
});

export type GameOptions = zod.TypeOf<typeof GameOptionsSchema>;

export interface Player {
  id: string;
  username: string;
}

export enum GamePhaseType {
  Lobby = "lobby",
  PlaySong = "play-song",
  Review = "review",
  Summary = "summary",
}

export type GamePhaseDefinition<Type, Data = undefined> = {
  type: Type;
  data: Data;
};

export interface PlaySongGamePhaseData {
  phaseEndDate: string;
  phaseStartDate: string;
  previewUrl: string;
}

export interface ReviewGamePhaseAnswer {
  player: Player;
  time?: number;
}

export interface PlayerScore {
  player: Player;
  added?: number;
  score: number;
}

export interface SongGuess {
  songName: string;
  artistName: string;
}

export interface ReviewGamePhaseData {
  track: SpotifyApi.TrackObjectFull;
  answers: ReviewGamePhaseAnswer[];
  score: PlayerScore[];
  wrongGuesses: SongGuess[];
}

export interface SummaryGamePhaseData {
  answers: ReviewGamePhaseAnswer[];
  score: PlayerScore[];
}

export type GamePhase =
  | GamePhaseDefinition<GamePhaseType.Lobby>
  | GamePhaseDefinition<GamePhaseType.PlaySong, PlaySongGamePhaseData>
  | GamePhaseDefinition<GamePhaseType.Review, ReviewGamePhaseData>
  | GamePhaseDefinition<GamePhaseType.Summary, SummaryGamePhaseData>;
