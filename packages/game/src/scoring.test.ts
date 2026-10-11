import { describe, expect, test } from 'bun:test'

import { pointsFor, roundResult, totalScore } from './scoring'
import { DEFAULT_TIMINGS } from './types'
import type { Guess, Round } from './types'

const { roundMs } = DEFAULT_TIMINGS

const guess = (at: number, correct: boolean): Guess => ({
  at,
  correct,
  trackId: 1,
  title: '',
  artist: '',
})

const round = (guesses: Round['guesses']): Round => ({
  track: {
    id: 1,
    title: 'Song',
    titleShort: 'Song',
    artist: 'Artist',
    album: '',
    cover: '',
  },
  startsAt: 1000,
  endsAt: 1000 + roundMs,
  guesses,
})

describe('pointsFor', () => {
  test('gives the maximum for an instant answer', () => {
    expect(pointsFor(0, roundMs)).toBe(1000)
  })

  test('decreases linearly over the round', () => {
    expect(pointsFor(roundMs / 2, roundMs)).toBe(550)
  })

  test('never drops below the minimum', () => {
    expect(pointsFor(roundMs, roundMs)).toBe(100)
    expect(pointsFor(roundMs * 2, roundMs)).toBe(100)
  })

  test('clamps negative elapsed time', () => {
    expect(pointsFor(-500, roundMs)).toBe(1000)
  })
})

describe('roundResult', () => {
  test('scores the correct guess and counts wrong ones', () => {
    const r = round({
      a: [guess(2000, false), guess(4000, false), guess(1000 + 3000, true)],
    })
    expect(roundResult(r, 'a')).toEqual({
      points: pointsFor(3000, roundMs),
      elapsedMs: 3000,
      wrongGuesses: 2,
    })
  })

  test('returns nulls for a player who did not find the song', () => {
    const r = round({ a: [guess(2000, false)] })
    expect(roundResult(r, 'a')).toEqual({
      points: null,
      elapsedMs: null,
      wrongGuesses: 1,
    })
    expect(roundResult(r, 'nobody')).toEqual({
      points: null,
      elapsedMs: null,
      wrongGuesses: 0,
    })
  })

  test('scales with the length of the round', () => {
    const short: Round = {
      ...round({ a: [guess(1000 + 5000, true)] }),
      endsAt: 1000 + 10_000,
    }
    expect(roundResult(short, 'a').points).toBe(pointsFor(5000, 10_000))
    expect(roundResult(short, 'a').points).toBe(550)
  })
})

describe('totalScore', () => {
  test('sums points over rounds', () => {
    const rounds = [
      round({ a: [guess(1000, true)] }),
      round({ a: [guess(2000, false)] }),
      round({ a: [guess(1000 + roundMs / 2, true)] }),
    ]
    expect(totalScore(rounds, 'a')).toBe(1000 + 550)
    expect(totalScore(rounds, 'b')).toBe(0)
  })
})
