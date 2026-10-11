// Server functions that proxy Deezer searches. They require room
// credentials, so our Deezer quota isn't open to the whole internet.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { music } from './music.server'
import { rooms } from './rooms.server'
import { credentialsSchema } from '#/lib/credentials'

export const SEARCH_MIN_LENGTH = 2

const searchSchema = z.object({
  credentials: credentialsSchema,
  query: z.string().trim().min(SEARCH_MIN_LENGTH).max(100),
})

const notInRoom = { ok: false, error: 'not_in_room' } as const

export const searchTracksFn = createServerFn({ method: 'GET' })
  .validator(searchSchema)
  .handler(({ data }) =>
    rooms.authorize(data.credentials)
      ? music.searchTracks(data.query)
      : notInRoom,
  )

export const searchPlaylistsFn = createServerFn({ method: 'GET' })
  .validator(searchSchema)
  .handler(({ data }) =>
    rooms.authorize(data.credentials)
      ? music.searchPlaylists(data.query)
      : notInRoom,
  )

export const featuredPlaylistsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ credentials: credentialsSchema }))
  .handler(({ data }) =>
    rooms.authorize(data.credentials) ? music.featuredPlaylists() : notInRoom,
  )
