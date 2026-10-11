import { ROOM_CODE_LENGTH, normalizeRoomCode } from '@sonq/game'
import type { Result } from '@sonq/game'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { About, FAQ } from '#/components/About'
import { NameForm } from '#/components/NameForm'
import { ERROR_TEXT, GENERIC_ERROR, Input, Panel, Shell } from '#/components/ui'
import { trackEvent } from '#/lib/analytics'
import type { Credentials } from '#/lib/credentials'
import { saveCredentials } from '#/lib/session'
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
  pageMeta,
} from '#/lib/site'
import { createRoomFn, joinRoomFn } from '#/server/rooms'

// What sonq is, for search engines: the site, the game as a free web app,
// and the FAQ that's also rendered on the page.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      image: OG_IMAGE.url,
      applicationCategory: 'GameApplication',
      applicationSubCategory: 'Music quiz',
      genre: ['Music', 'Trivia', 'Party game'],
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript and a modern web browser',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: pageMeta({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      path: '/',
    }),
    links: [{ rel: 'canonical', href: absoluteUrl('/') }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(STRUCTURED_DATA),
      },
    ],
  }),
  component: Home,
})

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
      if (mode === 'create') trackEvent('room-create')
      else trackEvent('room-join', { via: 'code' })
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
          A free multiplayer music quiz. Everyone hears the same 30-second
          preview. Find it in the search first to score the most points.
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

      <About />
    </Shell>
  )
}
