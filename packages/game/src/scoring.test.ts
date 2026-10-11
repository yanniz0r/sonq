import { describe, expect, test } from 'bun:test'

import { pointsFor, roundResult, totalScore } from './scoring'
import { ROUND_MS } from './types'
import type { Guess, Round } from './types'

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
  endsAt: 1000 + ROUND_MS,
  guesses,
})

describe('pointsFor', () => {
  test('gives the maximum for an instant answer', () => {
    expect(pointsFor(0)).toBe(1000)
  })

  test('decreases linearly over the round', () => {
    expect(pointsFor(ROUND_MS / 2)).toBe(550)
  })

  test('never drops below the minimum', () => {
    expect(pointsFor(ROUND_MS)).toBe(100)
    expect(pointsFor(ROUND_MS * 2)).toBe(100)
  })

  test('clamps negative elapsed time', () => {
    expect(pointsFor(-500)).toBe(1000)
  })
})

describe('roundResult', () => {
  test('scores the correct guess and counts wrong ones', () => {
    const r = round({
      a: [guess(2000, false), guess(4000, false), guess(1000 + 3000, true)],
    })
    expect(roundResult(r, 'a')).toEqual({
      points: pointsFor(3000),
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
})

describe('totalScore', () => {
  test('sums points over rounds', () => {
    const rounds = [
      round({ a: [guess(1000, true)] }),
      round({ a: [guess(2000, false)] }),
      round({ a: [guess(1000 + ROUND_MS / 2, true)] }),
    ]
    expect(totalScore(rounds, 'a')).toBe(1000 + 550)
    expect(totalScore(rounds, 'b')).toBe(0)
  })
})
