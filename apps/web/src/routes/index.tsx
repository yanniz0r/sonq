import { ROOM_CODE_LENGTH, normalizeRoomCode } from '@sonq/game'
import type { Result } from '@sonq/game'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { NameForm } from '#/components/NameForm'
import { ERROR_TEXT, GENERIC_ERROR, Input, Panel, Shell } from '#/components/ui'
import type { Credentials } from '#/lib/credentials'
import { saveCredentials } from '#/lib/session'
import { createRoomFn, joinRoomFn } from '#/server/rooms'

export const Route = createFileRoute('/')({ component: Home })

type Mode = 'create' | 'join'

function Home() {
  const navigate = useNavigate()
  const createRoom = useServerFn(createRoomFn)
  const joinRoom = useServerFn(joinRoomFn)
  const [mode, setMode] = useState<Mode>('create')
  const [code, setCode] = useState('')

  const enter = useMutation({
    mutationFn: (name: string): Promise<Result<Credentials>> =>
      mode === 'create'
        ? createRoom({ data: { name } })
        : joinRoom({ data: { code, name } }),
    onSuccess: (result) => {
      if (!result.ok) return
      const { code: joined, playerId, secret } = result
      saveCredentials({ code: joined, playerId, secret })
      void navigate({ to: '/r/$code', params: { code: joined } })
    },
  })

  const error = enter.isError
    ? GENERIC_ERROR
    : enter.data && !enter.data.ok
      ? ERROR_TEXT[enter.data.error]
      : null

  return (
    <Shell>
      <section className="py-6 text-center">
        <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
          Guess the song.
          <br />
          <span className="text-fuchsia-400">Faster than your friends.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-neutral-400">
          Everyone hears the same 30-second preview. Find it in the search first
          to score the most points.
        </p>
      </section>

      <Panel className="mx-auto w-full max-w-md">
        <div
          className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1"
          role="tablist"
        >
          {(['create', 'join'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                enter.reset()
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-fuchsia-500 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              {m === 'create' ? 'New room' : 'Join a room'}
            </button>
          ))}
        </div>

        <NameForm
          submitLabel={mode === 'create' ? 'Create room' : 'Join room'}
          pending={
            enter.isPending ||
            (mode === 'join' && code.length !== ROOM_CODE_LENGTH)
          }
          onSubmit={(name) => enter.mutate(name)}
        >
          {mode === 'join' && (
            <Input
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              placeholder="Room code"
              aria-label="Room code"
              className="text-center font-bold tracking-[.4em] uppercase"
            />
          )}
        </NameForm>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </Panel>
    </Shell>
  )
}
