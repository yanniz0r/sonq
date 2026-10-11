import { describe, expect, test } from 'bun:test'

import { reduce } from './reducer'
import {
  T0,
  apply,
  command,
  correctGuessFor,
  currentRound,
  expectError,
  makePlayer,
  makePlaylist,
  makeRoom,
  phaseOf,
  wrongGuess,
} from './testing'
import { DEFAULT_TIMINGS, GUESS_COOLDOWN_MS, MAX_PLAYERS } from './types'
import type { Room } from './types'

const { countdownMs, roundMs, revealMs } = DEFAULT_TIMINGS

const START = T0 + countdownMs // the moment round 0 opens for guesses
const start = (room = makeRoom()) =>
  apply(room, command('h', { type: 'start' }))
const deadline = (room: Room, now: number) =>
  apply(room, { type: 'deadline' }, now)

describe('setPlaylist', () => {
  const playlist = makePlaylist(3)

  test('host sets the playlist in the lobby and resets played tracks', () => {
    const room = apply(makeRoom({ played: [1, 2] }), {
      type: 'setPlaylist',
      by: 'h',
      playlist,
    })
    expect(room.playlist).toBe(playlist)
    expect(room.played).toEqual([])
  })

  test('rejects non-hosts, strangers and running games', () => {
    expectError(
      makeRoom(),
      { type: 'setPlaylist', by: 'p', playlist },
      'not_host',
    )
    expectError(
      makeRoom(),
      { type: 'setPlaylist', by: 'x', playlist },
      'not_in_room',
    )
    expectError(
      start(),
      { type: 'setPlaylist', by: 'h', playlist },
      'wrong_phase',
    )
  })
})

describe('updateSettings', () => {
  test('host changes the number of rounds', () => {
    const room = apply(
      makeRoom(),
      command('h', { type: 'updateSettings', rounds: 5 }),
    )
    expect(room.settings.rounds).toBe(5)
  })

  test('only the host, only in the lobby', () => {
    const cmd = { type: 'updateSettings', rounds: 5 } as const
    expectError(makeRoom(), command('p', cmd), 'not_host')
    expectError(start(), command('h', cmd), 'wrong_phase')
  })
})

describe('start', () => {
  test('deals the first round after a countdown', () => {
    const room = start()
    const round = currentRound(room)
    expect(round.startsAt).toBe(T0 + countdownMs)
    expect(round.endsAt).toBe(T0 + countdownMs + roundMs)
    expect(round.guesses).toEqual({})
    expect(room.played).toEqual([round.track.id])
  })

  test('needs a playlist', () => {
    expectError(
      makeRoom({ playlist: null }),
      command('h', { type: 'start' }),
      'no_playlist',
    )
  })

  test('only the host, only in the lobby', () => {
    expectError(makeRoom(), command('p', { type: 'start' }), 'not_host')
    expectError(start(), command('h', { type: 'start' }), 'wrong_phase')
  })

  test('paces the game with the timings from deps', () => {
    const timings = { countdownMs: 100, roundMs: 1000, revealMs: 500 }
    const run = (
      room: Room,
      now: number,
      action = command('h', { type: 'start' }),
    ) => {
      const result = reduce(room, action, { now, random: () => 0, timings })
      if (!result.ok) throw new Error(result.error)
      return result.room
    }
    const round = currentRound(run(makeRoom(), T0))
    expect([round.startsAt, round.endsAt]).toEqual([T0 + 100, T0 + 1100])

    const revealed = run(run(makeRoom(), T0), T0 + 1100, { type: 'deadline' })
    expect(phaseOf(revealed, 'reveal').endsAt).toBe(T0 + 1600)
  })

  test('works solo', () => {
    const room = makeRoom({ players: [makePlayer('h')] })
    expect(start(room).phase.kind).toBe('round')
  })

  test('rejects commands from players who are not in the room', () => {
    expectError(makeRoom(), command('x', { type: 'start' }), 'not_in_room')
  })
})

describe('guess', () => {
  test('records a correct guess', () => {
    const room = start()
    const next = apply(room, command('p', correctGuessFor(room)), START + 500)
    expect(currentRound(next).guesses.p).toEqual([
      expect.objectContaining({ at: START + 500, correct: true }),
    ])
  })

  test('accepts another version of the same song', () => {
    const room = start()
    const { track } = currentRound(room)
    const next = apply(
      room,
      command('p', {
        type: 'guess',
        trackId: 999_999,
        title: `${track.titleShort} - Live`,
        artist: track.artist.toUpperCase(),
      }),
      START,
    )
    expect(currentRound(next).guesses.p?.[0]?.correct).toBe(true)
  })

  test('records a wrong guess', () => {
    const next = apply(start(), command('p', wrongGuess), START)
    expect(currentRound(next).guesses.p?.[0]?.correct).toBe(false)
  })

  test('is rejected during the countdown and after the round', () => {
    const room = start()
    expectError(room, command('p', wrongGuess), 'too_early', START - 1)
    expectError(room, command('p', wrongGuess), 'too_late', START + roundMs)
  })

  test('enforces a cooldown after a wrong guess', () => {
    const room = apply(start(), command('p', wrongGuess), START)
    expectError(
      room,
      command('p', wrongGuess),
      'cooldown',
      START + GUESS_COOLDOWN_MS - 1,
    )
    const later = apply(
      room,
      command('p', wrongGuess),
      START + GUESS_COOLDOWN_MS,
    )
    expect(currentRound(later).guesses.p).toHaveLength(2)
  })

  test('rejects further guesses once the song was found', () => {
    const room = start()
    const found = apply(room, command('p', correctGuessFor(room)), START)
    expectError(
      found,
      command('p', wrongGuess),
      'already_correct',
      START + 5000,
    )
  })

  test('is only possible during a round', () => {
    expectError(makeRoom(), command('p', wrongGuess), 'wrong_phase')
  })
})

describe('auto-reveal', () => {
  test('reveals once every connected player found the song', () => {
    const room = start()
    const guess = correctGuessFor(room)
    const one = apply(room, command('h', guess), START)
    expect(one.phase.kind).toBe('round')

    const both = apply(one, command('p', guess), START + 1000)
    const reveal = phaseOf(both, 'reveal')
    expect(reveal.endsAt).toBe(START + 1000 + revealMs)
    expect(reveal.round.guesses.p).toHaveLength(1)
  })

  test('ignores disconnected players', () => {
    const room = start()
    const offline = apply(room, {
      type: 'presence',
      playerId: 'p',
      connected: false,
    })
    const next = apply(offline, command('h', correctGuessFor(room)), START)
    expect(next.phase.kind).toBe('reveal')
  })

  test('triggers when the last missing player disconnects', () => {
    const room = start()
    const found = apply(room, command('h', correctGuessFor(room)), START)
    const next = apply(
      found,
      { type: 'presence', playerId: 'p', connected: false },
      START + 100,
    )
    expect(next.phase.kind).toBe('reveal')
  })

  test('triggers when the last missing player leaves', () => {
    const room = start()
    const found = apply(room, command('h', correctGuessFor(room)), START)
    const next = apply(found, command('p', { type: 'leave' }), START + 100)
    expect(next.phase.kind).toBe('reveal')
  })

  test('does not reveal a round nobody is connected to', () => {
    const room = start()
    const gone = apply(
      apply(room, { type: 'presence', playerId: 'h', connected: false }),
      { type: 'presence', playerId: 'p', connected: false },
    )
    expect(gone.phase.kind).toBe('round')
  })
})

describe('deadline', () => {
  test('does nothing before the deadline', () => {
    const room = start()
    expect(deadline(room, START + roundMs - 1)).toBe(room)
  })

  test('does nothing in phases without a deadline', () => {
    const room = makeRoom()
    expect(deadline(room, T0 + 999_999)).toBe(room)
  })

  test('reveals a round when its time is up', () => {
    const end = START + roundMs
    const reveal = phaseOf(deadline(start(), end), 'reveal')
    expect(reveal.endsAt).toBe(end + revealMs)
  })

  test('deals the next round when the reveal is over', () => {
    const end = START + roundMs
    const revealed = deadline(start(), end)
    const first = phaseOf(revealed, 'reveal').round

    const next = deadline(revealed, end + revealMs)
    const round = currentRound(next)
    expect(next.history).toEqual([first])
    expect(round.track.id).not.toBe(first.track.id)
    expect(round.startsAt).toBe(end + revealMs + countdownMs)
    expect(next.played).toEqual([first.track.id, round.track.id])
  })

  test('ends the game after the last round', () => {
    let room = start(makeRoom({ settings: { rounds: 5 } }))
    for (let i = 0; i < 5; i++) {
      const { endsAt } = currentRound(room)
      room = deadline(room, endsAt)
      room = deadline(room, phaseOf(room, 'reveal').endsAt)
    }
    expect(room.phase.kind).toBe('ended')
    expect(room.history).toHaveLength(5)
  })

  test('a short playlist caps the number of rounds', () => {
    let room = start(makeRoom({ playlist: makePlaylist(2) }))
    for (let i = 0; i < 2; i++) {
      room = deadline(room, currentRound(room).endsAt)
      room = deadline(room, phaseOf(room, 'reveal').endsAt)
    }
    expect(room.phase.kind).toBe('ended')
    expect(new Set(room.history.map((r) => r.track.id)).size).toBe(2)
  })
})

describe('next', () => {
  test('host skips the rest of the reveal', () => {
    const revealed = deadline(start(), START + roundMs)
    const next = apply(
      revealed,
      command('h', { type: 'next' }),
      START + roundMs + 1,
    )
    expect(next.history).toHaveLength(1)
    expect(next.phase.kind).toBe('round')
  })

  test('only the host, only during the reveal', () => {
    const revealed = deadline(start(), START + roundMs)
    expectError(revealed, command('p', { type: 'next' }), 'not_host')
    expectError(start(), command('h', { type: 'next' }), 'wrong_phase')
  })
})

describe('end', () => {
  test('drops a round that was never revealed', () => {
    const room = apply(start(), command('h', { type: 'end' }))
    expect(room.phase.kind).toBe('ended')
    expect(room.history).toEqual([])
  })

  test('keeps the round that is being revealed', () => {
    const revealed = deadline(start(), START + roundMs)
    const room = apply(revealed, command('h', { type: 'end' }))
    expect(room.phase.kind).toBe('ended')
    expect(room.history).toHaveLength(1)
  })

  test('only the host, only during a game', () => {
    expectError(start(), command('p', { type: 'end' }), 'not_host')
    expectError(makeRoom(), command('h', { type: 'end' }), 'wrong_phase')
  })
})

describe('restart', () => {
  const ended = () => apply(start(), command('h', { type: 'end' }))

  test('returns to the lobby and keeps track of played songs', () => {
    const before = ended()
    const room = apply(before, command('h', { type: 'restart' }))
    expect(room.phase.kind).toBe('lobby')
    expect(room.history).toEqual([])
    expect(room.played).toEqual(before.played)
  })

  test('does not repeat songs until the playlist runs out', () => {
    const playlist = makePlaylist(2)
    const room = makeRoom({ playlist, played: [1] })
    expect(currentRound(start(room)).track.id).toBe(2)

    const exhausted = makeRoom({ playlist, played: [1, 2] })
    const next = start(exhausted)
    expect(currentRound(next).track.id).toBe(1)
    expect(next.played).toEqual([1])
  })

  test('only the host, only after the game', () => {
    expectError(ended(), command('p', { type: 'restart' }), 'not_host')
    expectError(makeRoom(), command('h', { type: 'restart' }), 'wrong_phase')
  })
})

describe('join', () => {
  test('adds the player, even mid-game', () => {
    const room = apply(start(), { type: 'join', player: makePlayer('n') })
    expect(room.players.map((p) => p.id)).toEqual(['h', 'p', 'n'])
  })

  test('rejects players once the room is full', () => {
    const players = Array.from({ length: MAX_PLAYERS }, (_, i) =>
      makePlayer(`p${i}`),
    )
    expectError(
      makeRoom({ players }),
      { type: 'join', player: makePlayer('n') },
      'room_full',
    )
  })
})

describe('leave', () => {
  test('hands the host role to the longest-present connected player', () => {
    const room = makeRoom({
      players: [
        makePlayer('h', T0),
        { ...makePlayer('a', T0 + 1), connected: false },
        makePlayer('b', T0 + 2),
      ],
    })
    const next = apply(room, command('h', { type: 'leave' }))
    expect(next.hostId).toBe('b')
  })

  test('leaves an empty room behind when the last player leaves', () => {
    const room = makeRoom({ players: [makePlayer('h')] })
    expect(apply(room, command('h', { type: 'leave' })).players).toEqual([])
  })
})

describe('presence and host timeout', () => {
  const offlineHost = () =>
    apply(makeRoom(), { type: 'presence', playerId: 'h', connected: false })

  test('ignores unknown players', () => {
    const room = makeRoom()
    expect(
      apply(room, { type: 'presence', playerId: 'x', connected: false }),
    ).toBe(room)
  })

  test('keeps a connected host', () => {
    const room = makeRoom()
    expect(apply(room, { type: 'hostTimeout' })).toBe(room)
  })

  test('hands an absent host role to someone connected', () => {
    expect(apply(offlineHost(), { type: 'hostTimeout' }).hostId).toBe('p')
  })

  test('keeps the host when nobody else is connected', () => {
    const room = apply(offlineHost(), {
      type: 'presence',
      playerId: 'p',
      connected: false,
    })
    expect(apply(room, { type: 'hostTimeout' })).toBe(room)
  })
})
