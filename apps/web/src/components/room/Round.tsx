import { GUESS_COOLDOWN_MS } from '@sonq/game'
import type { PhaseView, Track } from '@sonq/game'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PlayerList } from './Players'
import { useRoomContext } from './RoomContext'
import { Button, Cover, ERROR_TEXT, Input, Panel } from '#/components/ui'
import { useDebounced } from '#/lib/useDebounced'
import { useServerNow } from '#/lib/useServerNow'
import { SEARCH_MIN_LENGTH, searchTracksFn } from '#/server/music'

type RoundPhase = Extract<PhaseView, { kind: 'round' }>

export function Round({ phase }: { phase: RoundPhase }) {
  const { view, clockOffset, isHost, send } = useRoomContext()
  const now = useServerNow(clockOffset)
  const started = now >= phase.startsAt
  const found = phase.myGuesses.some((g) => g.correct)
  const remaining = Math.max(0, phase.endsAt - now)
  const progress = started ? remaining / (phase.endsAt - phase.startsAt) : 1

  return (
    <>
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          Round {phase.index + 1} of {phase.total}
        </span>
        {isHost && (
          <Button variant="ghost" onClick={() => void send({ type: 'end' })}>
            End game
          </Button>
        )}
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Time left"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-fuchsia-500 transition-[width] duration-200 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {!started ? (
        <Panel className="py-16 text-center">
          <p className="text-neutral-400">Get ready…</p>
          <p className="font-display text-8xl font-black tabular-nums">
            {Math.ceil((phase.startsAt - now) / 1000)}
          </p>
        </Panel>
      ) : found ? (
        <Panel className="border-emerald-400/40 bg-emerald-500/10 py-10 text-center">
          <h1 className="font-display text-3xl font-black text-emerald-300">
            You got it! 🎉
          </h1>
          <p className="mt-2 text-neutral-300">
            Waiting for the others… {Math.ceil(remaining / 1000)}s left
          </p>
        </Panel>
      ) : (
        <Guessing
          phase={phase}
          remainingSeconds={Math.ceil(remaining / 1000)}
        />
      )}

      <Panel>
        <PlayerList
          view={view}
          badge={(p) => (phase.correctIds.includes(p.id) ? '✅' : null)}
        />
      </Panel>
    </>
  )
}

function Guessing({
  phase,
  remainingSeconds,
}: {
  phase: RoundPhase
  remainingSeconds: number
}) {
  const { credentials, send } = useRoomContext()
  const [input, setInput] = useState('')
  const query = useDebounced(input.trim(), 300)
  const [coolingDown, setCoolingDown] = useState(false)
  const searchTracks = useServerFn(searchTracksFn)

  const results = useQuery({
    queryKey: ['tracks', query],
    queryFn: () => searchTracks({ data: { credentials, query } }),
    enabled: query.length >= SEARCH_MIN_LENGTH,
    staleTime: 10 * 60_000,
  })

  const guess = async (track: Track) => {
    setCoolingDown(true)
    const accepted = await send({
      type: 'guess',
      trackId: track.id,
      title: track.titleShort,
      artist: track.artist,
    })
    // A correct guess replaces this view; a wrong one locks guessing briefly.
    setTimeout(() => setCoolingDown(false), accepted ? GUESS_COOLDOWN_MS : 0)
  }

  const wrong = phase.myGuesses.filter((g) => !g.correct)
  const tracks = results.data?.ok ? results.data.tracks : []

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-black">What's this song?</h1>
        <span className="font-semibold tabular-nums">{remainingSeconds}s</span>
      </div>
      <Input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search by title or artist"
        aria-label="Search by title or artist"
      />

      {wrong.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Your wrong guesses">
          {wrong.map((g, i) => (
            <li
              key={i}
              className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300 line-through"
            >
              {g.title} · {g.artist}
            </li>
          ))}
        </ul>
      )}

      {results.data && !results.data.ok && (
        <p className="text-sm text-red-300">{ERROR_TEXT[results.data.error]}</p>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {tracks.map((track) => (
          <li key={track.id}>
            <button
              type="button"
              disabled={coolingDown}
              onClick={() => void guess(track)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition hover:border-fuchsia-400/60 disabled:opacity-50"
            >
              <Cover src={track.cover} alt="" className="size-12" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {track.title}
                </span>
                <span className="block truncate text-sm text-neutral-400">
                  {track.artist}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
