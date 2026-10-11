// Values derived from a room. They are computed on demand and never stored,
// so they can't drift out of sync with the state they come from.
import type { Phase, Room, Round } from './types'

// When the current phase ends by itself, or null if it waits for a player.
export function deadlineOf(phase: Phase): number | null {
  switch (phase.kind) {
    case 'round':
      return phase.round.endsAt
    case 'reveal':
      return phase.endsAt
    case 'lobby':
    case 'ended':
      return null
  }
}

// A short playlist caps the game, so no song repeats within one game.
export function totalRounds(room: Pick<Room, 'settings' | 'playlist'>) {
  return Math.min(
    room.settings.rounds,
    room.playlist?.tracks.length ?? room.settings.rounds,
  )
}

// Every round whose answer everyone has seen, including the one on screen.
export function revealedRounds(
  room: Pick<Room, 'history' | 'phase'>,
): Array<Round> {
  return room.phase.kind === 'reveal'
    ? [...room.history, room.phase.round]
    : room.history
}
