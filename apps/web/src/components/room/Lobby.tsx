import { ROUND_OPTIONS } from '@sonq/game'
import { useState } from 'react'

import { PlayerList } from './Players'
import { PlaylistPicker } from './PlaylistPicker'
import { useRoomContext } from './RoomContext'
import { Button, Cover, Panel } from '#/components/ui'
import { trackEvent } from '#/lib/analytics'

export function Lobby() {
  const { view, isHost, send } = useRoomContext()
  const { playlist } = view

  return (
    <>
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-xl font-bold">
            Players{' '}
            <span className="text-neutral-500">{view.players.length}</span>
          </h1>
          <InviteButton code={view.code} />
        </div>
        <PlayerList view={view} />
      </Panel>

      <Panel>
        <h2 className="mb-4 font-display text-xl font-bold">Playlist</h2>
        {playlist ? (
          <div className="mb-4 flex items-center gap-4">
            <Cover src={playlist.cover} alt="" className="size-20" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{playlist.title}</p>
              <p className="text-sm text-neutral-400">
                {playlist.trackCount} playable songs
              </p>
            </div>
          </div>
        ) : (
          !isHost && (
            <p className="text-neutral-400">
              Waiting for the host to pick a playlist…
            </p>
          )
        )}
        {isHost && <PlaylistPicker />}
      </Panel>

      <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-neutral-400">Rounds</span>
          {isHost ? (
            <div className="flex gap-1" role="group" aria-label="Rounds">
              {ROUND_OPTIONS.map((rounds) => (
                <Button
                  key={rounds}
                  variant={
                    view.settings.rounds === rounds ? 'primary' : 'secondary'
                  }
                  aria-pressed={view.settings.rounds === rounds}
                  onClick={() => void send({ type: 'updateSettings', rounds })}
                >
                  {rounds}
                </Button>
              ))}
            </div>
          ) : (
            <span className="font-semibold">{view.settings.rounds}</span>
          )}
        </div>
        {isHost ? (
          <Button
            className="px-8 py-3 text-base"
            disabled={!playlist}
            onClick={() =>
              void send({ type: 'start' }).then((ok) => {
                if (ok)
                  trackEvent('game-start', {
                    players: view.players.length,
                    rounds: view.settings.rounds,
                  })
              })
            }
          >
            Start game
          </Button>
        ) : (
          <p className="text-neutral-400">Waiting for the host to start…</p>
        )}
      </Panel>
    </>
  )
}

function InviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${code}`)
      trackEvent('invite-copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked; the code is visible in the header anyway.
    }
  }
  return (
    <Button variant="secondary" onClick={() => void copy()}>
      {copied ? 'Link copied!' : 'Copy invite link'}
    </Button>
  )
}
