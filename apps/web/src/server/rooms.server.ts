// In-memory room store. It runs every action through the pure reducer, bumps
// the version, and pushes a projected snapshot to each SSE subscriber. It
// also owns every timer: one deadline timer per room (the only thing that
// moves a game forward on its own), disconnect grace periods, and host
// handoff. All of it lives in this process, so sonq runs as one instance.
import {
  DEFAULT_ROUNDS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  deadlineOf,
  project,
  reduce,
} from '@sonq/game'
import type {
  Action,
  Command,
  Player,
  PlayerId,
  Playlist,
  Result,
  Room,
  RoomEvent,
  Track,
} from '@sonq/game'

import type { Credentials } from '#/lib/credentials'

// A reload or a brief network blip shouldn't make a player flicker offline.
const DISCONNECT_GRACE_MS = 10_000
// A host gone this long hands the room to someone still here.
const HOST_TIMEOUT_MS = 60_000
const IDLE_ROOM_MS = 2 * 60 * 60_000
const MAX_ROOMS = 1000
const HUES = [330, 200, 150, 40, 270, 90, 20, 180, 300, 60, 240, 120]

export type Cancel = () => void

export interface Clock {
  now: () => number
  // Runs `run` after `ms`; the returned function cancels it.
  schedule: (run: () => void, ms: number) => Cancel
}

export type Listener = (event: RoomEvent) => void

interface Subscriber {
  playerId: PlayerId
  listener: Listener
}

interface Entry {
  room: Room
  subscribers: Set<Subscriber>
  graceTimers: Map<PlayerId, Cancel>
  hostTimer: Cancel | null
  deadline: { at: number; cancel: Cancel } | null
}

export interface RoomStore {
  createRoom: (name: string) => Result<Credentials>
  joinRoom: (code: string, name: string) => Result<Credentials>
  runCommand: (credentials: Credentials, command: Command) => Result
  setPlaylist: (credentials: Credentials, playlist: Playlist) => Result
  // The room, if the credentials belong to one of its players.
  authorize: (credentials: Credentials) => Room | null
  // The track of round `index`, while that round is playing or revealed.
  trackOfRound: (credentials: Credentials, index: number) => Track | null
  // Registers an SSE listener. Returns null when the credentials don't
  // match a seat (room gone, or the player left).
  subscribe: (
    credentials: Credentials,
    listener: Listener,
  ) => (() => void) | null
}

const systemClock: Clock = {
  now: () => Date.now(),
  schedule: (run, ms) => {
    const timer = setTimeout(run, ms)
    return () => clearTimeout(timer)
  },
}

export function createRoomStore({
  clock = systemClock,
  random = Math.random,
}: { clock?: Clock; random?: () => number } = {}): RoomStore {
  const entries = new Map<string, Entry>()

  function dispatch(code: string, action: Action): Result<{ room: Room }> {
    const entry = entries.get(code)
    if (!entry) return { ok: false, error: 'room_not_found' }

    const now = clock.now()
    const result = reduce(entry.room, action, { now, random })
    if (!result.ok) return result

    // Everyone left: the room is over.
    if (result.room.players.length === 0) {
      dropRoom(code)
      return { ok: true, room: result.room }
    }

    if (result.room !== entry.room) {
      entry.room = {
        ...result.room,
        version: entry.room.version + 1,
        lastActivity: now,
      }
      broadcast(entry)
      watchHost(entry)
    }
    armDeadline(entry)
    return { ok: true, room: entry.room }
  }

  function broadcast(entry: Entry) {
    for (const sub of entry.subscribers) {
      sub.listener(stateEvent(entry.room, sub.playerId))
    }
  }

  function stateEvent(room: Room, playerId: PlayerId): RoomEvent {
    return {
      type: 'state',
      view: project(room, playerId),
      serverNow: clock.now(),
    }
  }

  // Keeps exactly one timer per room, aimed at the current phase's
  // deadline. An early wake-up is harmless: the reducer ignores it and the
  // timer is re-armed for the remaining time.
  function armDeadline(entry: Entry) {
    const at = deadlineOf(entry.room.phase)
    if (entry.deadline?.at === at) return
    entry.deadline?.cancel()
    entry.deadline = null
    if (at === null) return

    const { code } = entry.room
    const cancel = clock.schedule(
      () => {
        entry.deadline = null
        dispatch(code, { type: 'deadline' })
      },
      Math.max(0, at - clock.now()),
    )
    entry.deadline = { at, cancel }
  }

  function watchHost(entry: Entry) {
    const { room } = entry
    const host = room.players.find((p) => p.id === room.hostId)
    if (host?.connected) {
      entry.hostTimer?.()
      entry.hostTimer = null
    } else if (!entry.hostTimer) {
      entry.hostTimer = clock.schedule(() => {
        entry.hostTimer = null
        dispatch(room.code, { type: 'hostTimeout' })
      }, HOST_TIMEOUT_MS)
    }
  }

  // Marks a player offline unless a stream (re)opens within the grace
  // period. Also armed right after joining, so a player whose stream never
  // opens doesn't hold up the auto-reveal.
  function scheduleDisconnect(entry: Entry, playerId: PlayerId) {
    entry.graceTimers.get(playerId)?.()
    entry.graceTimers.set(
      playerId,
      clock.schedule(() => {
        entry.graceTimers.delete(playerId)
        dispatch(entry.room.code, {
          type: 'presence',
          playerId,
          connected: false,
        })
      }, DISCONNECT_GRACE_MS),
    )
  }

  function dropRoom(code: string) {
    const entry = entries.get(code)
    if (!entry) return
    for (const sub of entry.subscribers) sub.listener({ type: 'closed' })
    entry.graceTimers.forEach((cancel) => cancel())
    entry.hostTimer?.()
    entry.deadline?.cancel()
    entries.delete(code)
  }

  function collectIdleRooms() {
    const cutoff = clock.now() - IDLE_ROOM_MS
    for (const [code, entry] of entries) {
      if (entry.room.lastActivity < cutoff) dropRoom(code)
    }
  }

  function authorize({ code, playerId, secret }: Credentials) {
    const entry = entries.get(code)
    const player = entry?.room.players.find((p) => p.id === playerId)
    return entry && player?.secret === secret ? entry : null
  }

  function makePlayer(name: string, taken: Array<Player>): Player {
    const used = new Set(taken.map((p) => p.hue))
    return {
      id: crypto.randomUUID(),
      name,
      secret: randomHex(24),
      hue:
        HUES.find((h) => !used.has(h)) ?? HUES[taken.length % HUES.length] ?? 0,
      // Counts as connected until its stream proves otherwise, so a fresh
      // joiner isn't skipped by the auto-reveal before their stream opens.
      connected: true,
      joinedAt: clock.now(),
    }
  }

  function seat(entry: Entry, player: Player): Result<Credentials> {
    scheduleDisconnect(entry, player.id)
    return {
      ok: true,
      code: entry.room.code,
      playerId: player.id,
      secret: player.secret,
    }
  }

  return {
    createRoom(name) {
      // Rooms only grow here, so this is where idle ones are swept.
      collectIdleRooms()
      if (entries.size >= MAX_ROOMS)
        return { ok: false, error: 'too_many_rooms' }

      let code = randomCode()
      while (entries.has(code)) code = randomCode()
      const host = makePlayer(name, [])
      const entry: Entry = {
        room: {
          code,
          hostId: host.id,
          players: [host],
          settings: { rounds: DEFAULT_ROUNDS },
          playlist: null,
          played: [],
          phase: { kind: 'lobby' },
          history: [],
          version: 0,
          lastActivity: clock.now(),
        },
        subscribers: new Set(),
        graceTimers: new Map(),
        hostTimer: null,
        deadline: null,
      }
      entries.set(code, entry)
      return seat(entry, host)
    },

    joinRoom(code, name) {
      const entry = entries.get(code)
      if (!entry) return { ok: false, error: 'room_not_found' }
      const player = makePlayer(name, entry.room.players)
      const result = dispatch(code, { type: 'join', player })
      return result.ok ? seat(entry, player) : result
    },

    runCommand(credentials, command) {
      if (!authorize(credentials)) return { ok: false, error: 'not_in_room' }
      const result = dispatch(credentials.code, {
        type: 'command',
        by: credentials.playerId,
        command,
      })
      return result.ok ? { ok: true } : result
    },

    setPlaylist(credentials, playlist) {
      if (!authorize(credentials)) return { ok: false, error: 'not_in_room' }
      const result = dispatch(credentials.code, {
        type: 'setPlaylist',
        by: credentials.playerId,
        playlist,
      })
      return result.ok ? { ok: true } : result
    },

    authorize: (credentials) => authorize(credentials)?.room ?? null,

    trackOfRound(credentials, index) {
      const room = authorize(credentials)?.room
      if (!room || room.history.length !== index) return null
      const { phase } = room
      return phase.kind === 'round' || phase.kind === 'reveal'
        ? phase.round.track
        : null
    },

    subscribe(credentials, listener) {
      const entry = authorize(credentials)
      if (!entry) return null
      const { playerId } = credentials

      const sub: Subscriber = { playerId, listener }
      entry.subscribers.add(sub)
      entry.graceTimers.get(playerId)?.()
      entry.graceTimers.delete(playerId)

      const me = entry.room.players.find((p) => p.id === playerId)
      if (me?.connected) listener(stateEvent(entry.room, playerId))
      else
        dispatch(entry.room.code, {
          type: 'presence',
          playerId,
          connected: true,
        })

      return () => {
        entry.subscribers.delete(sub)
        const stillOpen = [...entry.subscribers].some(
          (s) => s.playerId === playerId,
        )
        if (!stillOpen && entries.get(entry.room.code) === entry)
          scheduleDisconnect(entry, playerId)
      }
    },
  }
}

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH))
  return Array.from(
    bytes,
    (b) => ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length],
  ).join('')
}

function randomHex(byteCount: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// One store per process, shared by the server-fn bundle and the SSE route,
// and kept across Vite's SSR hot reloads.
const g = globalThis as typeof globalThis & { __sonqRooms?: RoomStore }
export const rooms: RoomStore = (g.__sonqRooms ??= createRoomStore())
