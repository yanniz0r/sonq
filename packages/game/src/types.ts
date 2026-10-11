// Server-side domain model of a sonq room. `Room` never leaves the server
// as-is: it holds player secrets and the track that is currently playing.
// Clients only ever receive what `project` (view.ts) builds for them, in the
// shapes defined in protocol.ts.
import type { Command, GameError } from './protocol'

// How long each timed part of a game lasts. They come in through `Deps`, so
// tests can run games faster; DEFAULT_TIMINGS is what players get. A round
// must not outlast Deezer's 30 s previews.
export interface Timings {
  countdownMs: number
  roundMs: number
  revealMs: number
}

export const DEFAULT_TIMINGS: Timings = {
  countdownMs: 3_000,
  roundMs: 30_000,
  revealMs: 8_000,
}

// A game rule rather than pacing, so it isn't part of `Timings`.
export const GUESS_COOLDOWN_MS = 2_000
export const MAX_PLAYERS = 16
export const ROUND_OPTIONS = [5, 10, 15] as const
export const DEFAULT_ROUNDS: RoundCount = 10

export type RoundCount = (typeof ROUND_OPTIONS)[number]
export type NonEmptyArray<T> = [T, ...Array<T>]
export type PlayerId = string
export type TrackId = number

export interface Track {
  id: TrackId
  title: string
  // The title without version suffixes like "(Remastered 2011)". Guesses are
  // matched against this one.
  titleShort: string
  artist: string
  album: string
  cover: string
}

export interface Playlist {
  id: number
  title: string
  cover: string
  // Only tracks that have a preview, so every one of them is playable.
  tracks: NonEmptyArray<Track>
}

export interface Player {
  id: PlayerId
  name: string
  secret: string
  hue: number
  connected: boolean
  joinedAt: number
}

export interface Guess {
  at: number
  trackId: TrackId
  title: string
  artist: string
  correct: boolean
}

export interface Round {
  track: Track
  // The countdown runs until `startsAt`; guesses count from then on.
  startsAt: number
  endsAt: number
  guesses: Partial<Record<PlayerId, Array<Guess>>>
}

// The round number is never stored: it is always `history.length`.
export type Phase =
  | { kind: 'lobby' }
  | { kind: 'round'; round: Round }
  | { kind: 'reveal'; round: Round; endsAt: number }
  | { kind: 'ended' }

export interface Settings {
  rounds: RoundCount
}

export interface Room {
  code: string
  hostId: PlayerId
  players: Array<Player>
  settings: Settings
  playlist: Playlist | null
  // Tracks dealt in this room. Survives restarts so songs don't repeat until
  // the playlist runs out.
  played: Array<TrackId>
  phase: Phase
  // Finished rounds of the current game. Scores are derived from it.
  history: Array<Round>
  version: number
  lastActivity: number
}

// What can happen to a room: player commands plus events raised by the store.
export type Action =
  | { type: 'command'; by: PlayerId; command: Command }
  // The store loads the playlist asynchronously, then dispatches the result.
  | { type: 'setPlaylist'; by: PlayerId; playlist: Playlist }
  | { type: 'join'; player: Player }
  | { type: 'presence'; playerId: PlayerId; connected: boolean }
  | { type: 'hostTimeout' }
  // The store's timer fired. The reducer checks `now` against the deadline
  // itself, so stale or early timers are harmless.
  | { type: 'deadline' }

export interface Deps {
  now: number
  // Returns a float in [0, 1), like Math.random.
  random: () => number
  timings: Timings
}

export type Result<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: GameError }
