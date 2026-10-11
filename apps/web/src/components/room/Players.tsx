import type { RoomView } from '@sonq/game'

import { Avatar } from '#/components/ui'

type PlayerView = RoomView['players'][number]

export function byScore(players: Array<PlayerView>) {
  return players.toSorted((a, b) => b.score - a.score)
}

// Everyone in the room, with an optional badge per player.
export function PlayerList({
  view,
  badge,
}: {
  view: RoomView
  badge?: (player: PlayerView) => string | null
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {view.players.map((p) => {
        const text = badge?.(p)
        return (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-4 pl-1"
          >
            <Avatar name={p.name} hue={p.hue} dimmed={!p.connected} />
            <span className={p.connected ? '' : 'text-neutral-500'}>
              {p.name}
              {p.id === view.me && (
                <span className="text-neutral-500"> (you)</span>
              )}
              {!p.connected && (
                <span className="text-neutral-500"> (offline)</span>
              )}
            </span>
            {p.id === view.hostId && (
              <span title="Host" aria-label="Host">
                👑
              </span>
            )}
            {text && <span className="text-sm">{text}</span>}
          </li>
        )
      })}
    </ul>
  )
}

// Players ranked by total score, with optional points gained this round.
export function Scoreboard({
  view,
  gained,
}: {
  view: RoomView
  gained?: (playerId: string) => number | null
}) {
  return (
    <ol className="flex flex-col gap-2">
      {byScore(view.players).map((p, rank) => {
        const plus = gained?.(p.id)
        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${p.id === view.me ? 'bg-fuchsia-500/15' : 'bg-white/5'}`}
          >
            <span className="w-6 text-right font-bold text-neutral-400 tabular-nums">
              {rank + 1}.
            </span>
            <Avatar name={p.name} hue={p.hue} dimmed={!p.connected} />
            <span className="flex-1 truncate">{p.name}</span>
            {plus != null && (
              <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                +{plus}
              </span>
            )}
            <span className="w-16 text-right font-bold tabular-nums">
              {p.score}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
