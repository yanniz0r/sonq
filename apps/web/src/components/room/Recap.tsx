import type { PhaseView } from '@sonq/game'

import { Scoreboard, byScore } from './Players'
import { useRoomContext } from './RoomContext'
import { Button, Cover, Panel } from '#/components/ui'

type EndedPhase = Extract<PhaseView, { kind: 'ended' }>

export function Recap({
  phase,
  onLeave,
}: {
  phase: EndedPhase
  onLeave: () => void
}) {
  const { view, isHost, send } = useRoomContext()
  const [winner] = byScore(view.players)

  return (
    <>
      <Panel className="text-center">
        <p className="text-neutral-400">Game over</p>
        <h1 className="font-display text-4xl font-black">
          {winner && winner.score > 0
            ? `${winner.name} wins! 🏆`
            : 'No winner this time'}
        </h1>
      </Panel>

      <Panel>
        <Scoreboard view={view} />
      </Panel>

      {phase.songs.length > 0 && (
        <Panel>
          <h2 className="mb-3 font-display text-xl font-bold">Songs</h2>
          <ol className="flex flex-col gap-2">
            {phase.songs.map(({ track, correctCount }) => (
              <li key={track.id} className="flex items-center gap-3">
                <Cover src={track.cover} alt="" className="size-12" />
                <a
                  href={`https://www.deezer.com/track/${track.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="block truncate font-semibold">
                    {track.title}
                  </span>
                  <span className="block truncate text-sm text-neutral-400">
                    {track.artist}
                  </span>
                </a>
                <span className="text-sm text-neutral-400">
                  {correctCount}/{view.players.length} found it
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onLeave}>
          Leave
        </Button>
        {isHost ? (
          <Button onClick={() => void send({ type: 'restart' })}>
            Play again
          </Button>
        ) : (
          <p className="self-center text-neutral-400">Waiting for the host…</p>
        )}
      </div>
    </>
  )
}
