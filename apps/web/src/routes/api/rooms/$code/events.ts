import { createFileRoute } from '@tanstack/react-router'
import type { RoomEvent } from '@sonq/game'

import { credentialsFrom } from '#/server/request.server'
import { rooms } from '#/server/rooms.server'

// Proxies (Traefik, nginx) drop idle connections; a comment line every 15 s
// keeps the stream alive.
const HEARTBEAT_MS = 15_000

// The room's live state for one player. Every (re)connect starts with a full
// snapshot, so the client never has to catch up on missed events.
export const Route = createFileRoute('/api/rooms/$code/events')({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const credentials = credentialsFrom(request, params.code)
        const encoder = new TextEncoder()
        let cleanup = () => {}

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            let closed = false
            const send = (chunk: string) => {
              if (closed) return
              try {
                controller.enqueue(encoder.encode(chunk))
              } catch {
                cleanup() // the client went away
              }
            }
            const sendEvent = (event: RoomEvent) =>
              send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
            const close = () => {
              closed = true
              try {
                controller.close()
              } catch {
                // already closed
              }
            }

            send('retry: 2000\n\n')

            // `closed` is final: it ends the stream so the client stops
            // reconnecting.
            const unsubscribe =
              credentials &&
              rooms.subscribe(credentials, (event) => {
                sendEvent(event)
                if (event.type === 'closed') queueMicrotask(() => cleanup())
              })
            if (!unsubscribe) {
              sendEvent({ type: 'closed' })
              close()
              return
            }

            const heartbeat = setInterval(
              () => send(': ping\n\n'),
              HEARTBEAT_MS,
            )
            cleanup = () => {
              if (closed) return
              clearInterval(heartbeat)
              unsubscribe()
              close()
            }
            request.signal.addEventListener('abort', () => cleanup())
          },
          cancel() {
            cleanup()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
