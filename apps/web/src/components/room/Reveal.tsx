import type { PhaseView } from '@sonq/game'

import { Scoreboard } from './Players'
import { useRoomContext } from './RoomContext'
import { Button, Cover, Panel } from '#/components/ui'
import { useServerNow } from '#/lib/useServerNow'

type RevealPhase = Extract<PhaseView, { kind: 'reveal' }>

export function Reveal({ phase }: { phase: RevealPhase }) {
  const { view, clockOffset, isHost, send } = useRoomContext()
  const now = useServerNow(clockOffset)
  const seconds = Math.max(0, Math.ceil((phase.endsAt - now) / 1000))
  const isLast = phase.index + 1 >= phase.total
  const { track } = phase
  const results = new Map(phase.results.map((r) => [r.playerId, r]))
  const mine = results.get(view.me)

  return (
    <>
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          Round {phase.index + 1} of {phase.total}
        </span>
        <span>
          {isLast ? 'Results' : 'Next round'} in {seconds}s
        </span>
      </div>

      <Panel className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <Cover src={track.cover} alt={track.album} className="size-40" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-400">It was</p>
          <h1 className="font-display text-3xl font-black">{track.title}</h1>
          <p className="text-xl text-neutral-300">{track.artist}</p>
          <p className="mt-3 font-semibold">
            {mine?.points != null ? (
              <span className="text-emerald-300">
                You found it in {formatSeconds(mine.elapsedMs)} · +{mine.points}
              </span>
            ) : (
              <span className="text-neutral-400">You didn't get this one.</span>
            )}
          </p>
          <a
            href={`https://www.deezer.com/track/${track.id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-fuchsia-300 hover:underline"
          >
            Listen on Deezer ↗
          </a>
        </div>
      </Panel>

      <Panel>
        <Scoreboard
          view={view}
          gained={(id) => results.get(id)?.points ?? null}
        />
      </Panel>

      {isHost && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => void send({ type: 'end' })}>
            End game
          </Button>
          <Button onClick={() => void send({ type: 'next' })}>
            {isLast ? 'Show results' : 'Next round'}
          </Button>
        </div>
      )}
    </>
  )
}

function formatSeconds(ms: number | null) {
  return ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`
}
