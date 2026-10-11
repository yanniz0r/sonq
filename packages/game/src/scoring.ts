// Points are never stored: they are derived from guess timestamps whenever
// someone needs a score.
import { ROUND_MS } from './types'
import type { Guess, PlayerId, Round } from './types'

const MAX_POINTS = 1000
const MIN_POINTS = 100

// Linear from MAX_POINTS at the first moment of the round down to
// MIN_POINTS at its very end.
export function pointsFor(elapsedMs: number): number {
  const progress = Math.min(Math.max(elapsedMs / ROUND_MS, 0), 1)
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * (1 - progress))
}

export function correctGuess(
  round: Round,
  playerId: PlayerId,
): Guess | undefined {
  return round.guesses[playerId]?.find((g) => g.correct)
}

export interface RoundResult {
  points: number | null
  elapsedMs: number | null
  wrongGuesses: number
}

export function roundResult(round: Round, playerId: PlayerId): RoundResult {
  const guesses = round.guesses[playerId] ?? []
  const correct = guesses.find((g) => g.correct)
  const wrongGuesses = guesses.filter((g) => !g.correct).length
  if (!correct) return { points: null, elapsedMs: null, wrongGuesses }
  const elapsedMs = correct.at - round.startsAt
  return { points: pointsFor(elapsedMs), elapsedMs, wrongGuesses }
}

export function totalScore(rounds: Array<Round>, playerId: PlayerId): number {
  return rounds.reduce(
    (sum, round) => sum + (roundResult(round, playerId).points ?? 0),
    0,
  )
}
