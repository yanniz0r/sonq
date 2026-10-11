import { describe, expect, test } from 'bun:test'

import { roomViewSchema } from './protocol'
import { pointsFor } from './scoring'
import {
  T0,
  apply,
  command,
  correctGuessFor,
  currentRound,
  makeRoom,
  wrongGuess,
} from './testing'
import { DEFAULT_TIMINGS } from './types'
import { project } from './view'
import type { Room } from './types'

const { countdownMs, roundMs } = DEFAULT_TIMINGS

const START = T0 + countdownMs

// Projects for a viewer and checks the result against the wire schema, so
// the implementation and the schema can't drift apart.
function view(room: Room, viewerId = 'p') {
  const projected = project(room, viewerId)
  expect(roomViewSchema.parse(projected)).toEqual(projected)
  return projected
}

function playedRound() {
  const room = apply(makeRoom(), command('h', { type: 'start' }))
  const withWrong = apply(room, command('p', wrongGuess), START)
  return apply(withWrong, command('h', correctGuessFor(room)), START + 3000)
}

describe('project', () => {
  test('never leaks secrets', () => {
    expect(JSON.stringify(view(makeRoom()))).not.toContain('secret')
  })

  test('lobby shows the playlist summary', () => {
    expect(view(makeRoom()).playlist).toEqual({
      id: 99,
      title: 'Hits',
      cover: '',
      trackCount: 20,
    })
  })

  test('round hides the track and other players guesses', () => {
    const room = playedRound()
    const { track } = currentRound(room)
    const projected = view(room, 'p')

    expect(JSON.stringify(projected)).not.toContain(track.titleShort)
    expect(projected.phase).toEqual({
      kind: 'round',
      index: 0,
      total: 10,
      startsAt: START,
      endsAt: START + roundMs,
      correctIds: ['h'],
      myGuesses: [{ title: 'Nope', artist: 'Nobody', correct: false }],
    })
  })

  test('round scores only count revealed rounds', () => {
    const projected = view(playedRound())
    expect(projected.players.map((p) => p.score)).toEqual([0, 0])
  })

  test('reveal shows the track, results and updated scores', () => {
    const room = playedRound()
    const { track } = currentRound(room)
    const revealed = apply(room, { type: 'deadline' }, START + roundMs)
    const projected = view(revealed)

    expect(projected.phase).toMatchObject({
      kind: 'reveal',
      index: 0,
      track: { id: track.id, title: track.title, artist: track.artist },
      results: [
        {
          playerId: 'h',
          points: pointsFor(3000, roundMs),
          elapsedMs: 3000,
          wrongGuesses: 0,
        },
        { playerId: 'p', points: null, elapsedMs: null, wrongGuesses: 1 },
      ],
    })
    expect(projected.players.map((p) => p.score)).toEqual([
      pointsFor(3000, roundMs),
      0,
    ])
  })

  test('ended lists the songs with how many players found them', () => {
    const room = playedRound()
    const revealed = apply(room, { type: 'deadline' }, START + roundMs)
    const ended = apply(revealed, command('h', { type: 'end' }))
    const projected = view(ended)

    expect(projected.phase).toEqual({
      kind: 'ended',
      songs: [
        {
          track: expect.objectContaining({ id: currentRound(room).track.id }),
          correctCount: 1,
        },
      ],
    })
    expect(projected.players[0]?.score).toBe(pointsFor(3000, roundMs))
  })
})
