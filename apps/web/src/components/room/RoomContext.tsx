import { createContext, use } from 'react'
import type { Command, RoomView } from '@sonq/game'

import type { Credentials } from '#/lib/credentials'

export interface RoomContextValue {
  view: RoomView
  credentials: Credentials
  clockOffset: number
  isHost: boolean
  // Sends a command; failures are shown to the player. Resolves to whether
  // it was accepted. The resulting state arrives via SSE, never from here.
  send: (command: Command) => Promise<boolean>
  showError: (message: string) => void
}

export const RoomContext = createContext<RoomContextValue | null>(null)

export function useRoomContext(): RoomContextValue {
  const value = use(RoomContext)
  if (!value) throw new Error('useRoomContext must be used inside a room')
  return value
}
