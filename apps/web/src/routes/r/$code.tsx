import { normalizeRoomCode } from '@sonq/game'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useState } from 'react'

import { NameForm } from '#/components/NameForm'
import { RoomGame } from '#/components/room/RoomGame'
import { ERROR_TEXT, GENERIC_ERROR, Panel, Shell } from '#/components/ui'
import type { Credentials } from '#/lib/credentials'
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from '#/lib/session'
import { joinRoomFn } from '#/server/rooms'

// Credentials live in localStorage, so there's nothing useful to render on
// the server.
export const Route = createFileRoute('/r/$code')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Room – sonq' }, { name: 'robots', content: 'noindex' }],
  }),
  component: RoomPage,
})

function RoomPage() {
  const code = normalizeRoomCode(Route.useParams().code)
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState(() => loadCredentials(code))
  const [notice, setNotice] = useState('')

  const onGone = useCallback(() => {
    clearCredentials(code)
    setNotice("This room is gone, or you're no longer in it.")
    setCredentials(null)
  }, [code])

  if (!credentials) {
    return (
      <JoinRoom
        code={code}
        notice={notice}
        onJoined={(joined) => {
          saveCredentials(joined)
          setNotice('')
          setCredentials(joined)
        }}
      />
    )
  }

  return (
    <RoomGame
      key={code}
      credentials={credentials}
      onGone={onGone}
      onLeft={() => {
        clearCredentials(code)
        void navigate({ to: '/' })
      }}
    />
  )
}

function JoinRoom({
  code,
  notice,
  onJoined,
}: {
  code: string
  notice: string
  onJoined: (credentials: Credentials) => void
}) {
  const joinRoom = useServerFn(joinRoomFn)
  const join = useMutation({
    mutationFn: (name: string) => joinRoom({ data: { code, name } }),
    onSuccess: (result) => {
      if (result.ok)
        onJoined({
          code: result.code,
          playerId: result.playerId,
          secret: result.secret,
        })
    },
  })

  const error = join.isError
    ? GENERIC_ERROR
    : join.data && !join.data.ok
      ? ERROR_TEXT[join.data.error]
      : notice

  return (
    <Shell>
      <Panel className="mx-auto w-full max-w-md">
        <h1 className="mb-1 font-display text-2xl font-black">
          Join room <span className="text-fuchsia-400">{code}</span>
        </h1>
        <p className="mb-4 text-neutral-400">Pick a name and you're in.</p>
        <NameForm
          submitLabel="Join room"
          pending={join.isPending}
          onSubmit={(name) => join.mutate(name)}
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </Panel>
    </Shell>
  )
}
