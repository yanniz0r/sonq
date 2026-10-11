import { roomEventSchema } from '@sonq/game'
import type { RoomView } from '@sonq/game'
import { useEffect, useState } from 'react'

import type { Credentials } from './credentials'

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting'

export interface RoomConnection {
  view: RoomView | null
  status: ConnectionStatus
  // The room is gone, or these credentials no longer hold a seat in it.
  closed: boolean
  // Server time minus local time, so deadlines can be shown on local clocks.
  clockOffset: number
}

// Subscribes to a room's SSE stream. EventSource reconnects on its own and
// the server resends a full snapshot each time; `version` guards against
// applying an older snapshot over a newer one. Every event is validated.
export function useRoom({
  code,
  playerId,
  secret,
}: Credentials): RoomConnection {
  const [view, setView] = useState<RoomView | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [closed, setClosed] = useState(false)
  const [clockOffset, setClockOffset] = useState(0)

  useEffect(() => {
    setView(null)
    setClosed(false)
    setStatus('connecting')

    const params = new URLSearchParams({ playerId, secret })
    const source = new EventSource(`/api/rooms/${code}/events?${params}`)
    source.onopen = () => setStatus('open')
    source.onerror = () => setStatus('reconnecting')

    const onEvent = (message: MessageEvent<string>) => {
      const parsed = roomEventSchema.safeParse(parseJson(message.data))
      if (!parsed.success) return
      const event = parsed.data
      switch (event.type) {
        case 'state':
          setClockOffset(event.serverNow - Date.now())
          setView((prev) =>
            prev && prev.version > event.view.version ? prev : event.view,
          )
          return
        case 'closed':
          source.close()
          setClosed(true)
          return
      }
    }
    source.addEventListener('state', onEvent)
    source.addEventListener('closed', onEvent)
    return () => source.close()
  }, [code, playerId, secret])

  return { view, status, closed, clockOffset }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
