// A player's seat in a room. Issued on create/join, kept in localStorage,
// and sent along with every request that acts on the room.
import { roomCodeSchema } from '@sonq/game'
import { z } from 'zod'

export const credentialsSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().min(1),
  secret: z.string().min(1),
})

export type Credentials = z.infer<typeof credentialsSchema>
