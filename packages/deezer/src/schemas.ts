// The parts of Deezer's public API responses that sonq uses. Unknown keys
// are stripped, so the schemas only describe what we rely on.
import { z } from 'zod'

export const deezerArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const deezerAlbumSchema = z.object({
  id: z.number(),
  title: z.string(),
  cover_medium: z.string(),
  cover_big: z.string(),
})

export const deezerTrackSchema = z.object({
  id: z.number(),
  readable: z.boolean(),
  title: z.string(),
  title_short: z.string(),
  // A signed URL that expires after roughly 15 minutes; empty when the
  // track has no preview.
  preview: z.string(),
  rank: z.number(),
  duration: z.number(),
  artist: deezerArtistSchema,
  album: deezerAlbumSchema,
})

const ownerSchema = z.object({ name: z.string() })

export const deezerPlaylistSchema = z.object({
  id: z.number(),
  title: z.string(),
  nb_tracks: z.number(),
  picture_medium: z.string(),
  picture_big: z.string(),
  // Search results name the owner `user`; /playlist/{id} calls it `creator`.
  user: ownerSchema.optional(),
  creator: ownerSchema.optional(),
})

// Deezer reports most errors as HTTP 200 with this body.
export const deezerErrorSchema = z.object({
  error: z.object({
    type: z.string(),
    message: z.string(),
    code: z.number(),
  }),
})

// Items are validated one by one (see client.ts), so one malformed entry
// doesn't sink a whole page.
export const deezerListSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().optional(),
  next: z.string().optional(),
})

export type DeezerTrack = z.infer<typeof deezerTrackSchema>
export type DeezerPlaylist = z.infer<typeof deezerPlaylistSchema>
