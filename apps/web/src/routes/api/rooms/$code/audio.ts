import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { music } from '#/server/music.server'
import { credentialsFrom } from '#/server/request.server'
import { rooms } from '#/server/rooms.server'

const roundSchema = z.coerce.number().int().min(0)

// Redirects to a freshly signed preview of the given round's track. The
// client never sees the track id or title, and because Deezer's preview URLs
// expire, they are resolved per request instead of stored.
export const Route = createFileRoute('/api/rooms/$code/audio')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const credentials = credentialsFrom(request, params.code)
        const round = roundSchema.safeParse(
          new URL(request.url).searchParams.get('round'),
        )
        if (!credentials || !round.success)
          return new Response('Bad request', { status: 400 })

        const track = rooms.trackOfRound(credentials, round.data)
        if (!track) return new Response('Not found', { status: 404 })

        const preview = await music.previewUrl(track.id)
        if (!preview)
          return new Response('Preview unavailable', { status: 502 })

        return new Response(null, {
          status: 302,
          headers: {
            Location: preview,
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
          },
        })
      },
    },
  },
})
