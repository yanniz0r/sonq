// Server functions for rooms. Every in-room command goes through
// `roomCommandFn`, so there is a single auth path, and the command and error
// unions flow through to the client's types.
import { commandSchema, playerNameSchema, roomCodeSchema } from '@sonq/game'
import type { Result } from '@sonq/game'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { music } from './music.server'
import { rooms } from './rooms.server'
import { credentialsSchema } from '#/lib/credentials'

export const createRoomFn = createServerFn({ method: 'POST' })
  .validator(z.object({ name: playerNameSchema }))
  .handler(({ data }) => rooms.createRoom(data.name))

export const joinRoomFn = createServerFn({ method: 'POST' })
  .validator(z.object({ code: roomCodeSchema, name: playerNameSchema }))
  .handler(({ data }) => rooms.joinRoom(data.code, data.name))

export const roomCommandFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ credentials: credentialsSchema, command: commandSchema }),
  )
  .handler(({ data }) => rooms.runCommand(data.credentials, data.command))

// Loading a playlist takes several Deezer requests, so it happens here,
// before the store sees anything. The reducer then validates the change.
export const selectPlaylistFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      credentials: credentialsSchema,
      playlistId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<Result> => {
    // A cheap check first, so only the host can make us call Deezer.
    const room = rooms.authorize(data.credentials)
    if (!room) return { ok: false, error: 'not_in_room' }
    if (room.hostId !== data.credentials.playerId)
      return { ok: false, error: 'not_host' }

    const loaded = await music.loadPlaylist(data.playlistId)
    if (!loaded.ok) return loaded
    return rooms.setPlaylist(data.credentials, loaded.playlist)
  })
