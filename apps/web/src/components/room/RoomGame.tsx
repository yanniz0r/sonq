import { useServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import type { Command, PhaseView, RoomView } from '@sonq/game'

import { Lobby } from './Lobby'
import { Recap } from './Recap'
import { Reveal } from './Reveal'
import { RoomContext } from './RoomContext'
import { Round } from './Round'
import { RoundAudio } from './RoundAudio'
import type { RoomContextValue } from './RoomContext'
import { ERROR_TEXT, GENERIC_ERROR, Shell, Toast } from '#/components/ui'
import { trackEvent } from '#/lib/analytics'
import type { Credentials } from '#/lib/credentials'
import { loadVolume, saveVolume } from '#/lib/session'
import { useRoom } from '#/lib/useRoom'
import { roomCommandFn } from '#/server/rooms'

const TOAST_MS = 2600

export function RoomGame({
  credentials,
  onGone,
  onLeft,
}: {
  credentials: Credentials
  // The room closed or this seat is no longer valid.
  onGone: () => void
  onLeft: () => void
}) {
  const { view, status, closed, clockOffset } = useRoom(credentials)
  const runCommand = useServerFn(roomCommandFn)
  const [toast, setToast] = useState('')
  const [volume, setVolume] = useState(loadVolume)

  useEffect(() => {
    if (closed) onGone()
  }, [closed, onGone])

  useTrackGameEnd(view)

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast])

  async function send(command: Command): Promise<boolean> {
    try {
      const result = await runCommand({ data: { credentials, command } })
      if (result.ok) return true
      if (result.error === 'not_in_room') onGone()
      else setToast(ERROR_TEXT[result.error])
    } catch {
      setToast(GENERIC_ERROR)
    }
    return false
  }

  async function leave() {
    if (view) trackEvent('room-leave', { phase: view.phase.kind })
    try {
      await runCommand({ data: { credentials, command: { type: 'leave' } } })
    } catch {
      // Leave locally anyway: the seat goes offline and the server hands
      // the room on.
    }
    onLeft()
  }

  const changeVolume = (next: number) => {
    setVolume(next)
    saveVolume(next)
  }

  const header = (
    <div className="flex items-center gap-3">
      <label className="hidden items-center gap-2 text-sm text-neutral-400 sm:flex">
        <span aria-hidden>🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          aria-label="Volume"
          className="w-24 accent-fuchsia-500"
        />
      </label>
      <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs tracking-widest">
        ROOM <b>{credentials.code}</b>
      </span>
      <button
        type="button"
        onClick={() => void leave()}
        className="text-sm text-neutral-400 hover:text-neutral-100"
      >
        Leave
      </button>
    </div>
  )

  if (!view) {
    return (
      <Shell right={header}>
        <p className="text-neutral-400">Connecting…</p>
      </Shell>
    )
  }

  const context: RoomContextValue = {
    view,
    credentials,
    clockOffset,
    isHost: view.hostId === view.me,
    send,
    showError: setToast,
  }

  return (
    <RoomContext value={context}>
      <Shell right={header}>
        <PhaseScreen phase={view.phase} onLeave={() => void leave()} />
      </Shell>
      <RoundAudio
        src={audioSrc(view, credentials)}
        startsAt={view.phase.kind === 'round' ? view.phase.startsAt : null}
        clockOffset={clockOffset}
        volume={volume}
      />
      {status === 'reconnecting' ? (
        <Toast>Reconnecting…</Toast>
      ) : (
        toast && <Toast>{toast}</Toast>
      )}
    </RoomContext>
  )
}

function PhaseScreen({
  phase,
  onLeave,
}: {
  phase: PhaseView
  onLeave: () => void
}) {
  switch (phase.kind) {
    case 'lobby':
      return <Lobby />
    case 'round':
      return <Round phase={phase} />
    case 'reveal':
      return <Reveal phase={phase} />
    case 'ended':
      return <Recap phase={phase} onLeave={onLeave} />
  }
}

// Reports a finished game once, from the host only (one event per game, not
// per player). It watches the phase change rather than the recap, so
// reloading the results doesn't count the game again.
function useTrackGameEnd(view: RoomView | null) {
  const previous = useRef<PhaseView['kind'] | null>(null)
  useEffect(() => {
    if (!view) return
    const { phase } = view
    const ended =
      phase.kind === 'ended' &&
      (previous.current === 'round' || previous.current === 'reveal')
    previous.current = phase.kind
    if (!ended || view.hostId !== view.me) return
    const players = view.players.length
    const played = phase.songs.length
    const found = phase.songs.reduce((sum, s) => sum + s.correctCount, 0)
    trackEvent('game-end', {
      players,
      rounds: view.settings.rounds,
      played,
      completed: played === view.settings.rounds,
      foundPercent:
        played && players ? Math.round((100 * found) / (played * players)) : 0,
    })
  }, [view])
}

// The same URL for a round and its reveal, so the song keeps playing.
function audioSrc(view: RoomView, { code, playerId, secret }: Credentials) {
  const { phase } = view
  if (phase.kind !== 'round' && phase.kind !== 'reveal') return null
  const params = new URLSearchParams({
    playerId,
    secret,
    round: String(phase.index),
  })
  return `/api/rooms/${code}/audio?${params}`
}
