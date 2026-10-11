// The room state machine: (room, action) → next room, or a typed error.
//
//   lobby ─start→ round ─deadline | all correct→ reveal ─deadline | next→ round …
//                                                       └─ after the last round → ended ─restart→ lobby
//
// It is pure. Time and randomness come in through `deps`, timers live in the
// store (which only ever dispatches `deadline`), and the store reads
// everything else it has to do off the result (a room without players is
// closed). Returning the same `room` object means "nothing changed".
import { isSameSong } from './match'
import { correctGuess } from './scoring'
import { totalRounds } from './selectors'
import {
  COUNTDOWN_MS,
  GUESS_COOLDOWN_MS,
  MAX_PLAYERS,
  REVEAL_MS,
  ROUND_MS,
} from './types'
import type {
  Action,
  Deps,
  Guess,
  NonEmptyArray,
  Player,
  PlayerId,
  Playlist,
  Room,
  Round,
  Track,
  TrackId,
} from './types'
import type { Command, GameError } from './protocol'

export type ReduceResult =
  { ok: true; room: Room } | { ok: false; error: GameError }

const fail = (error: GameError): ReduceResult => ({ ok: false, error })
const done = (room: Room): ReduceResult => ({ ok: true, room })

export function reduce(room: Room, action: Action, deps: Deps): ReduceResult {
  switch (action.type) {
    case 'join':
      if (room.players.length >= MAX_PLAYERS) return fail('room_full')
      return done({ ...room, players: [...room.players, action.player] })

    case 'presence': {
      if (!isMember(room, action.playerId)) return done(room)
      const players = room.players.map((p) =>
        p.id === action.playerId ? { ...p, connected: action.connected } : p,
      )
      return done(autoReveal({ ...room, players }, deps))
    }

    case 'hostTimeout': {
      const host = room.players.find((p) => p.id === room.hostId)
      if (host?.connected) return done(room)
      const next = longestPresent(room.players.filter((p) => p.connected))
      return done(next ? { ...room, hostId: next.id } : room)
    }

    case 'deadline':
      return done(onDeadline(room, deps))

    case 'setPlaylist':
      if (!isMember(room, action.by)) return fail('not_in_room')
      if (room.hostId !== action.by) return fail('not_host')
      if (room.phase.kind !== 'lobby') return fail('wrong_phase')
      return done({ ...room, playlist: action.playlist, played: [] })

    case 'command':
      if (!isMember(room, action.by)) return fail('not_in_room')
      return runCommand(room, action.by, action.command, deps)
  }
}

function runCommand(
  room: Room,
  by: PlayerId,
  command: Command,
  deps: Deps,
): ReduceResult {
  const { phase } = room
  const isHost = room.hostId === by

  switch (command.type) {
    case 'guess':
      return guess(room, by, command, deps)

    case 'leave':
      return removePlayer(room, by, deps)

    case 'updateSettings':
      if (!isHost) return fail('not_host')
      if (phase.kind !== 'lobby') return fail('wrong_phase')
      return done({ ...room, settings: { rounds: command.rounds } })

    case 'start':
      if (!isHost) return fail('not_host')
      if (phase.kind !== 'lobby') return fail('wrong_phase')
      if (!room.playlist) return fail('no_playlist')
      return done(deal({ ...room, history: [] }, room.playlist, deps))

    case 'next':
      if (!isHost) return fail('not_host')
      if (phase.kind !== 'reveal') return fail('wrong_phase')
      return done(advance(room, phase.round, deps))

    case 'end':
      if (!isHost) return fail('not_host')
      // An unrevealed round doesn't count: nobody saw its answer.
      if (phase.kind === 'round')
        return done({ ...room, phase: { kind: 'ended' } })
      if (phase.kind === 'reveal')
        return done({
          ...room,
          history: [...room.history, phase.round],
          phase: { kind: 'ended' },
        })
      return fail('wrong_phase')

    case 'restart':
      if (!isHost) return fail('not_host')
      if (phase.kind !== 'ended') return fail('wrong_phase')
      return done({ ...room, history: [], phase: { kind: 'lobby' } })
  }
}

function guess(
  room: Room,
  by: PlayerId,
  command: Extract<Command, { type: 'guess' }>,
  { now }: Deps,
): ReduceResult {
  const { phase } = room
  if (phase.kind !== 'round') return fail('wrong_phase')
  const { round } = phase
  if (now < round.startsAt) return fail('too_early')
  if (now >= round.endsAt) return fail('too_late')

  const mine = round.guesses[by] ?? []
  if (mine.some((g) => g.correct)) return fail('already_correct')
  const last = mine.at(-1)
  if (last && now - last.at < GUESS_COOLDOWN_MS) return fail('cooldown')

  const entry: Guess = {
    at: now,
    trackId: command.trackId,
    title: command.title,
    artist: command.artist,
    correct: isSameSong(command, round.track),
  }
  const next: Round = {
    ...round,
    guesses: { ...round.guesses, [by]: [...mine, entry] },
  }
  return done(
    autoReveal({ ...room, phase: { kind: 'round', round: next } }, { now }),
  )
}

function onDeadline(room: Room, deps: Deps): Room {
  const { phase } = room
  if (phase.kind === 'round' && deps.now >= phase.round.endsAt)
    return reveal(room, phase.round, deps.now)
  if (phase.kind === 'reveal' && deps.now >= phase.endsAt)
    return advance(room, phase.round, deps)
  return room
}

function reveal(room: Room, round: Round, now: number): Room {
  return { ...room, phase: { kind: 'reveal', round, endsAt: now + REVEAL_MS } }
}

// Archives the revealed round, then deals the next one or ends the game.
function advance(room: Room, round: Round, deps: Deps): Room {
  const history = [...room.history, round]
  if (!room.playlist || history.length >= totalRounds(room))
    return { ...room, history, phase: { kind: 'ended' } }
  return deal({ ...room, history }, room.playlist, deps)
}

function deal(room: Room, playlist: Playlist, deps: Deps): Room {
  const { track, played } = pickTrack(playlist.tracks, room.played, deps)
  const startsAt = deps.now + COUNTDOWN_MS
  const round: Round = {
    track,
    startsAt,
    endsAt: startsAt + ROUND_MS,
    guesses: {},
  }
  return { ...room, played, phase: { kind: 'round', round } }
}

// Deals from the tracks not played yet; once all of them were, starts over.
function pickTrack(
  tracks: NonEmptyArray<Track>,
  played: Array<TrackId>,
  { random }: Pick<Deps, 'random'>,
): { track: Track; played: Array<TrackId> } {
  const unplayed = tracks.filter((t) => !played.includes(t.id))
  if (!isNonEmpty(unplayed)) {
    const track = pick(tracks, random)
    return { track, played: [track.id] }
  }
  const track = pick(unplayed, random)
  return { track, played: [...played, track.id] }
}

// Reveals early once every connected player has found the song.
function autoReveal(room: Room, { now }: Pick<Deps, 'now'>): Room {
  const { phase } = room
  if (phase.kind !== 'round') return room
  const connected = room.players.filter((p) => p.connected)
  const allCorrect =
    connected.length > 0 &&
    connected.every((p) => correctGuess(phase.round, p.id))
  return allCorrect ? reveal(room, phase.round, now) : room
}

function removePlayer(
  room: Room,
  playerId: PlayerId,
  deps: Deps,
): ReduceResult {
  const players = room.players.filter((p) => p.id !== playerId)
  if (players.length === 0) return done({ ...room, players })

  let hostId = room.hostId
  if (hostId === playerId) {
    const connected = players.filter((p) => p.connected)
    hostId =
      longestPresent(connected.length ? connected : players)?.id ?? hostId
  }
  return done(autoReveal({ ...room, players, hostId }, deps))
}

function isMember(room: Room, playerId: PlayerId) {
  return room.players.some((p) => p.id === playerId)
}

function longestPresent(players: Array<Player>): Player | undefined {
  return players.toSorted((a, b) => a.joinedAt - b.joinedAt).at(0)
}

function isNonEmpty<T>(items: Array<T>): items is NonEmptyArray<T> {
  return items.length > 0
}

function pick<T>(items: NonEmptyArray<T>, random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0]
}
