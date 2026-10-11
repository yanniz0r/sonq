import { beforeEach, describe, expect, test } from 'bun:test'
import { COUNTDOWN_MS, REVEAL_MS, ROUND_MS } from '@sonq/game'
import type { Playlist, RoomEvent, RoomView, Track } from '@sonq/game'

import { createLogger } from './log.server'
import { createRoomStore } from './rooms.server'
import type { Clock, RoomStore } from './rooms.server'
import type { Credentials } from '#/lib/credentials'

// A clock whose timers only run when the test advances time.
function fakeClock() {
  let now = 1_000_000
  let nextId = 0
  const timers = new Map<number, { at: number; run: () => void }>()

  const clock: Clock = {
    now: () => now,
    schedule(run, ms) {
      const id = nextId++
      timers.set(id, { at: now + ms, run })
      return () => timers.delete(id)
    },
  }

  function advance(ms: number) {
    const target = now + ms
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= target)
        .sort(([, a], [, b]) => a.at - b.at)[0]
      if (!due) break
      timers.delete(due[0])
      now = due[1].at
      due[1].run()
    }
    now = target
  }

  return { clock, advance, pending: () => timers.size }
}

const track = (id: number): Track => ({
  id,
  title: `Song ${id}`,
  titleShort: `Song ${id}`,
  artist: `Artist ${id}`,
  album: '',
  cover: '',
})
const playlist: Playlist = {
  id: 1,
  title: 'Hits',
  cover: '',
  tracks: [track(1), track(2), track(3)],
}

function expectOk<T extends object>(
  result: ({ ok: true } & T) | { ok: false; error: string },
): T {
  if (!result.ok) throw new Error(`expected success, got ${result.error}`)
  return result
}

// Records the events one player receives.
function listen(store: RoomStore, credentials: Credentials) {
  const events: Array<RoomEvent> = []
  const unsubscribe = store.subscribe(credentials, (e) => events.push(e))
  if (!unsubscribe) throw new Error('subscription refused')
  const views = () =>
    events.flatMap((e): Array<RoomView> => (e.type === 'state' ? [e.view] : []))
  return { events, unsubscribe, latest: () => views().at(-1) }
}

let time: ReturnType<typeof fakeClock>
let store: RoomStore
let logLines: Array<string>

beforeEach(() => {
  time = fakeClock()
  logLines = []
  store = createRoomStore({
    clock: time.clock,
    random: () => 0,
    log: createLogger('rooms', {
      level: 'debug',
      write: (line) => logLines.push(line),
    }),
  })
})

function roomWithTwoPlayers() {
  const host = expectOk(store.createRoom('Host'))
  const guest = expectOk(store.joinRoom(host.code, 'Guest'))
  return { host, guest }
}

describe('room store', () => {
  test('sends the current state on subscribe and every change after', () => {
    const host = expectOk(store.createRoom('Host'))
    const stream = listen(store, host)
    expect(stream.latest()?.players.map((p) => p.name)).toEqual(['Host'])

    expectOk(store.joinRoom(host.code, 'Guest'))
    expect(stream.latest()?.players.map((p) => p.name)).toEqual([
      'Host',
      'Guest',
    ])
    expect(stream.latest()?.version).toBe(1)
  })

  test('rejects wrong credentials', () => {
    const { host } = roomWithTwoPlayers()
    const forged = { ...host, secret: 'nope' }
    expect(store.runCommand(forged, { type: 'start' })).toEqual({
      ok: false,
      error: 'not_in_room',
    })
    expect(store.subscribe(forged, () => {})).toBeNull()
    expect(store.authorize(forged)).toBeNull()
  })

  test('reports unknown rooms', () => {
    expect(store.joinRoom('ZZZZ', 'Guest')).toEqual({
      ok: false,
      error: 'room_not_found',
    })
  })

  test('passes reducer errors through', () => {
    const { guest } = roomWithTwoPlayers()
    expect(store.runCommand(guest, { type: 'start' })).toEqual({
      ok: false,
      error: 'not_host',
    })
  })

  test('drives a game forward with a single deadline timer', () => {
    const { host, guest } = roomWithTwoPlayers()
    const stream = listen(store, guest)
    listen(store, host)
    expectOk(store.setPlaylist(host, playlist))
    expectOk(store.runCommand(host, { type: 'updateSettings', rounds: 5 }))
    expectOk(store.runCommand(host, { type: 'start' }))
    expect(stream.latest()?.phase.kind).toBe('round')
    // Just the deadline: both players are connected, so no other timers.
    expect(time.pending()).toBe(1)

    time.advance(COUNTDOWN_MS + ROUND_MS)
    expect(stream.latest()?.phase).toMatchObject({ kind: 'reveal', index: 0 })
    expect(time.pending()).toBe(1)

    time.advance(REVEAL_MS)
    expect(stream.latest()?.phase).toMatchObject({ kind: 'round', index: 1 })
  })

  test('re-arms the deadline when the game is revealed early', () => {
    const { host, guest } = roomWithTwoPlayers()
    const stream = listen(store, host)
    listen(store, guest)
    expectOk(store.setPlaylist(host, playlist))
    expectOk(store.runCommand(host, { type: 'start' }))
    time.advance(COUNTDOWN_MS)

    const answer = store.trackOfRound(host, 0)
    if (!answer) throw new Error('no track in round 0')
    const guess = {
      type: 'guess',
      trackId: answer.id,
      title: answer.title,
      artist: answer.artist,
    } as const
    expectOk(store.runCommand(host, guess))
    expectOk(store.runCommand(guest, guess))
    expect(stream.latest()?.phase.kind).toBe('reveal')
    expect(time.pending()).toBe(1)

    time.advance(REVEAL_MS)
    expect(stream.latest()?.phase).toMatchObject({ kind: 'round', index: 1 })
  })

  test('only reveals the track of the current round', () => {
    const { host } = roomWithTwoPlayers()
    expect(store.trackOfRound(host, 0)).toBeNull()

    expectOk(store.setPlaylist(host, playlist))
    expectOk(store.runCommand(host, { type: 'start' }))
    expect(store.trackOfRound(host, 0)).toEqual(track(1))
    expect(store.trackOfRound(host, 1)).toBeNull()
    expect(store.trackOfRound({ ...host, secret: 'x' }, 0)).toBeNull()
  })

  test('marks a player offline only after the grace period', () => {
    const { host, guest } = roomWithTwoPlayers()
    const hostStream = listen(store, host)
    const guestStream = listen(store, guest)
    const guestOnline = () =>
      hostStream.latest()?.players.find((p) => p.id === guest.playerId)
        ?.connected

    guestStream.unsubscribe()
    time.advance(5_000)
    const reconnected = listen(store, guest) // back within the grace period
    time.advance(10_000)
    expect(guestOnline()).toBe(true)

    reconnected.unsubscribe()
    time.advance(10_000)
    expect(guestOnline()).toBe(false)
  })

  test('hands the room to another player when the host stays away', () => {
    const { host, guest } = roomWithTwoPlayers()
    const stream = listen(store, guest)
    // The host never opens a stream, so they go offline after the grace.
    time.advance(10_000)
    expect(stream.latest()?.hostId).toBe(host.playerId)
    time.advance(60_000)
    expect(stream.latest()?.hostId).toBe(guest.playerId)
  })

  test('closes the room when the last player leaves', () => {
    const host = expectOk(store.createRoom('Host'))
    const stream = listen(store, host)
    expectOk(store.runCommand(host, { type: 'leave' }))

    expect(stream.events.at(-1)).toEqual({ type: 'closed' })
    expect(store.joinRoom(host.code, 'Late')).toEqual({
      ok: false,
      error: 'room_not_found',
    })
    expect(time.pending()).toBe(0)
  })

  test('sweeps idle rooms when a new one is created', () => {
    const old = expectOk(store.createRoom('Old'))
    time.advance(2 * 60 * 60_000 + 60_000)
    expectOk(store.createRoom('New'))
    expect(store.authorize(old)).toBeNull()
  })

  test('logs a game without ever leaking player secrets', () => {
    const { host, guest } = roomWithTwoPlayers()
    listen(store, host)
    expectOk(store.setPlaylist(host, playlist))
    expectOk(store.runCommand(host, { type: 'start' }))
    time.advance(COUNTDOWN_MS)
    expectOk(
      store.runCommand(guest, {
        type: 'guess',
        trackId: 999,
        title: 'Song 1',
        artist: 'Artist 1',
      }),
    )
    store.runCommand({ ...guest, secret: 'forged' }, { type: 'end' })
    expectOk(store.runCommand(host, { type: 'end' }))

    const log = logLines.join('\n')
    expect(log).toContain('room created')
    expect(log).toContain('game started')
    expect(log).toContain('phase=lobby->round#1')
    expect(log).toContain('correct=true')
    expect(log).toContain('unauthorized')
    expect(log).toContain('game ended')
    expect(log).not.toContain(host.secret)
    expect(log).not.toContain(guest.secret)
  })
})
