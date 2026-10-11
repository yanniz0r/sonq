// Everything that crosses the wire, as Zod schemas. Commands are validated
// on the server before they reach the reducer, and every SSE event is
// validated on the client before it reaches React.
import { z } from 'zod'

import { ROUND_OPTIONS } from './types'

export const ROOM_CODE_LENGTH = 4
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const PLAYER_NAME_MAX = 16

export const GAME_ERRORS = [
  'not_host',
  'wrong_phase',
  'not_in_room',
  'room_full',
  'room_not_found',
  'too_many_rooms',
  'no_playlist',
  'playlist_empty',
  'playlist_not_found',
  'too_early',
  'too_late',
  'already_correct',
  'cooldown',
  'music_unavailable',
] as const

export const gameErrorSchema = z.enum(GAME_ERRORS)
export type GameError = z.infer<typeof gameErrorSchema>

export const playerNameSchema = z.string().trim().min(1).max(PLAYER_NAME_MAX)

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(ROOM_CODE_LENGTH)

export function normalizeRoomCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, ROOM_CODE_LENGTH)
}

// ---------------------------------------------------------------------------
// Commands (player → server)

const trackIdSchema = z.number().int().positive()

export const commandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('updateSettings'),
    rounds: z.literal(ROUND_OPTIONS),
  }),
  z.object({ type: z.literal('start') }),
  z.object({
    type: z.literal('guess'),
    trackId: trackIdSchema,
    title: z.string().min(1).max(300),
    artist: z.string().min(1).max(300),
  }),
  z.object({ type: z.literal('next') }),
  z.object({ type: z.literal('end') }),
  z.object({ type: z.literal('restart') }),
  z.object({ type: z.literal('leave') }),
])

export type Command = z.infer<typeof commandSchema>

// ---------------------------------------------------------------------------
// Room view (server → one player)

export const trackViewSchema = z.object({
  id: trackIdSchema,
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  cover: z.string(),
})

export const playlistViewSchema = z.object({
  id: z.number(),
  title: z.string(),
  cover: z.string(),
  trackCount: z.number(),
})

const myGuessSchema = z.object({
  title: z.string(),
  artist: z.string(),
  correct: z.boolean(),
})

const roundResultSchema = z.object({
  playerId: z.string(),
  // Null when the player didn't find the song.
  points: z.number().nullable(),
  elapsedMs: z.number().nullable(),
  wrongGuesses: z.number(),
})

export const phaseViewSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('lobby') }),
  z.object({
    kind: z.literal('round'),
    index: z.number(),
    total: z.number(),
    startsAt: z.number(),
    endsAt: z.number(),
    correctIds: z.array(z.string()),
    myGuesses: z.array(myGuessSchema),
  }),
  z.object({
    kind: z.literal('reveal'),
    index: z.number(),
    total: z.number(),
    endsAt: z.number(),
    track: trackViewSchema,
    results: z.array(roundResultSchema),
  }),
  z.object({
    kind: z.literal('ended'),
    songs: z.array(
      z.object({ track: trackViewSchema, correctCount: z.number() }),
    ),
  }),
])

export const roomViewSchema = z.object({
  code: z.string(),
  version: z.number(),
  me: z.string(),
  hostId: z.string(),
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      hue: z.number(),
      connected: z.boolean(),
      score: z.number(),
    }),
  ),
  settings: z.object({ rounds: z.literal(ROUND_OPTIONS) }),
  playlist: playlistViewSchema.nullable(),
  phase: phaseViewSchema,
})

export type RoomView = z.infer<typeof roomViewSchema>
export type PhaseView = z.infer<typeof phaseViewSchema>
export type TrackView = z.infer<typeof trackViewSchema>
export type PlaylistView = z.infer<typeof playlistViewSchema>

// What the SSE stream carries. `serverNow` lets clients estimate their clock
// offset, so countdowns and audio start in sync.
export const roomEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('state'),
    view: roomViewSchema,
    serverNow: z.number(),
  }),
  z.object({ type: z.literal('closed') }),
])

export type RoomEvent = z.infer<typeof roomEventSchema>
