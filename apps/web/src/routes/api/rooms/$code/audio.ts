import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { createLogger } from '#/server/log.server'
import { music } from '#/server/music.server'
import { credentialsFrom } from '#/server/request.server'
import { rooms } from '#/server/rooms.server'

const roundSchema = z.coerce.number().int().min(0)
const log = createLogger('audio')

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
        if (!credentials || !round.success) {
          log.debug('bad request', { code: params.code })
          return new Response('Bad request', { status: 400 })
        }
        const fields = {
          code: credentials.code,
          player: credentials.playerId,
          round: round.data,
        }

        const track = rooms.trackOfRound(credentials, round.data)
        if (!track) {
          log.debug('no such round', fields)
          return new Response('Not found', { status: 404 })
        }

        const preview = await music.previewUrl(track.id)
        if (!preview) {
          log.warn('preview unavailable', { ...fields, track: track.id })
          return new Response('Preview unavailable', { status: 502 })
        }

        log.debug('redirect', { ...fields, track: track.id })

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
