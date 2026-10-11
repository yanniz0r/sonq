// Builds what one player is allowed to see. Secrets never leave the server,
// and the playing track is withheld until the reveal: during a round, a
// player only learns which others already found it and how their own
// guesses went.
import { roundResult, totalScore } from './scoring'
import { revealedRounds, totalRounds } from './selectors'
import type { PhaseView, RoomView, TrackView } from './protocol'
import type { PlayerId, Room, Round, Track } from './types'

export function project(room: Room, viewerId: PlayerId): RoomView {
  const scored = revealedRounds(room)
  return {
    code: room.code,
    version: room.version,
    me: viewerId,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      hue: p.hue,
      connected: p.connected,
      score: totalScore(scored, p.id),
    })),
    settings: room.settings,
    playlist: room.playlist && {
      id: room.playlist.id,
      title: room.playlist.title,
      cover: room.playlist.cover,
      trackCount: room.playlist.tracks.length,
    },
    phase: projectPhase(room, viewerId),
  }
}

function projectPhase(room: Room, viewerId: PlayerId): PhaseView {
  const { phase } = room
  const index = room.history.length
  const total = totalRounds(room)

  switch (phase.kind) {
    case 'lobby':
      return { kind: 'lobby' }

    case 'round': {
      const { round } = phase
      return {
        kind: 'round',
        index,
        total,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        correctIds: room.players
          .filter((p) => round.guesses[p.id]?.some((g) => g.correct))
          .map((p) => p.id),
        myGuesses: (round.guesses[viewerId] ?? []).map((g) => ({
          title: g.title,
          artist: g.artist,
          correct: g.correct,
        })),
      }
    }

    case 'reveal':
      return {
        kind: 'reveal',
        index,
        total,
        endsAt: phase.endsAt,
        track: trackView(phase.round.track),
        results: room.players.map((p) => ({
          playerId: p.id,
          ...roundResult(phase.round, p.id),
        })),
      }

    case 'ended':
      return {
        kind: 'ended',
        songs: room.history.map((round) => ({
          track: trackView(round.track),
          correctCount: correctCount(round),
        })),
      }
  }
}

function trackView(track: Track): TrackView {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    cover: track.cover,
  }
}

function correctCount(round: Round) {
  return Object.values(round.guesses).filter((guesses) =>
    guesses?.some((g) => g.correct),
  ).length
}
