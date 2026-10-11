// Builders for tests of the game rules. Not exported from the package entry.
import { expect } from 'bun:test'

import { reduce } from './reducer'
import { DEFAULT_ROUNDS } from './types'
import type { Command, GameError } from './protocol'
import type {
  Action,
  Deps,
  Phase,
  Player,
  PlayerId,
  Playlist,
  Room,
  Round,
  Track,
} from './types'

export const T0 = 1_000_000

export function makeTrack(id: number): Track {
  return {
    id,
    title: `Song ${id} (Remastered)`,
    titleShort: `Song ${id}`,
    artist: `Artist ${id}`,
    album: `Album ${id}`,
    cover: `https://covers.test/${id}.jpg`,
  }
}

export function makePlaylist(trackCount = 20): Playlist {
  const [first, ...rest] = Array.from({ length: trackCount }, (_, i) =>
    makeTrack(i + 1),
  )
  if (!first) throw new Error('a playlist needs at least one track')
  return { id: 99, title: 'Hits', cover: '', tracks: [first, ...rest] }
}

export function makePlayer(id: PlayerId, joinedAt = T0): Player {
  return {
    id,
    name: id.toUpperCase(),
    secret: `secret-${id}`,
    hue: 200,
    connected: true,
    joinedAt,
  }
}

// A lobby with host `h` and player `p`, ready to start.
export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: 'ABCD',
    hostId: 'h',
    players: [makePlayer('h', T0), makePlayer('p', T0 + 1)],
    settings: { rounds: DEFAULT_ROUNDS },
    playlist: makePlaylist(),
    played: [],
    phase: { kind: 'lobby' },
    history: [],
    version: 0,
    lastActivity: T0,
    ...overrides,
  }
}

export const deps = (now = T0, random = () => 0): Deps => ({ now, random })

export const command = (by: PlayerId, cmd: Command): Action => ({
  type: 'command',
  by,
  command: cmd,
})

// Runs an action that must succeed and returns the next room.
export function apply(room: Room, action: Action, now = T0): Room {
  const result = reduce(room, action, deps(now))
  if (!result.ok) throw new Error(`expected success, got ${result.error}`)
  return result.room
}

export function expectError(
  room: Room,
  action: Action,
  error: GameError,
  now = T0,
) {
  expect(reduce(room, action, deps(now))).toEqual({ ok: false, error })
}

export function phaseOf<TKind extends Phase['kind']>(
  room: Room,
  kind: TKind,
): Extract<Phase, { kind: TKind }> {
  expect(room.phase.kind).toBe(kind)
  return room.phase as Extract<Phase, { kind: TKind }>
}

export const currentRound = (room: Room): Round => phaseOf(room, 'round').round

// A guess for exactly the track that is playing.
export function correctGuessFor(room: Room): Command {
  const { track } = currentRound(room)
  return {
    type: 'guess',
    trackId: track.id,
    title: track.title,
    artist: track.artist,
  }
}

export const wrongGuess: Command = {
  type: 'guess',
  trackId: 123_456,
  title: 'Nope',
  artist: 'Nobody',
}
