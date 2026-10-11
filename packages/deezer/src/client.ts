// A small typed client for Deezer's public API. It needs no credentials, but
// Deezer sends no CORS headers and allows ~50 requests per 5 s per IP, so it
// is meant to run on the server, behind a cache.
import {
  deezerErrorSchema,
  deezerListSchema,
  deezerPlaylistSchema,
  deezerTrackSchema,
} from './schemas'
import type { DeezerPlaylist, DeezerTrack } from './schemas'
import type { z } from 'zod'

export type DeezerErrorKind =
  'not_found' | 'quota_exceeded' | 'unavailable' | 'invalid_response'

export class DeezerError extends Error {
  constructor(
    readonly kind: DeezerErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'DeezerError'
  }
}

export interface DeezerClient {
  searchTracks: (query: string, limit?: number) => Promise<Array<DeezerTrack>>
  searchPlaylists: (
    query: string,
    limit?: number,
  ) => Promise<Array<DeezerPlaylist>>
  chartPlaylists: (limit?: number) => Promise<Array<DeezerPlaylist>>
  getPlaylist: (id: number) => Promise<DeezerPlaylist>
  // Follows pagination until `max` tracks were collected or the list ends.
  getPlaylistTracks: (id: number, max?: number) => Promise<Array<DeezerTrack>>
  getTrack: (id: number) => Promise<DeezerTrack>
}

export interface DeezerClientOptions {
  fetch?: (url: string) => Promise<Response>
  baseUrl?: string
}

const PAGE_SIZE = 100

// Deezer's documented error codes we treat specially.
const ERROR_CODES: Partial<Record<number, DeezerErrorKind>> = {
  4: 'quota_exceeded',
  800: 'not_found',
}

export function createDeezerClient({
  fetch = (url) => globalThis.fetch(url),
  baseUrl = 'https://api.deezer.com',
}: DeezerClientOptions = {}): DeezerClient {
  async function get(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<unknown> {
    const url = new URL(path, baseUrl)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }

    let response: Response
    try {
      response = await fetch(url.toString())
    } catch (cause) {
      throw new DeezerError('unavailable', `request failed: ${String(cause)}`)
    }
    if (!response.ok)
      throw new DeezerError('unavailable', `HTTP ${response.status}`)

    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new DeezerError('invalid_response', 'response is not JSON')
    }

    const error = deezerErrorSchema.safeParse(body)
    if (error.success) {
      const { code, message } = error.data.error
      throw new DeezerError(ERROR_CODES[code] ?? 'unavailable', message)
    }
    return body
  }

  async function getOne<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const parsed = schema.safeParse(await get(path))
    if (!parsed.success)
      throw new DeezerError('invalid_response', parsed.error.message)
    return parsed.data
  }

  async function getList<T>(
    path: string,
    params: Record<string, string | number>,
    schema: z.ZodType<T>,
  ) {
    const list = deezerListSchema.safeParse(await get(path, params))
    if (!list.success)
      throw new DeezerError('invalid_response', list.error.message)
    const items = list.data.data.flatMap((item) => {
      const parsed = schema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    })
    return { items, received: list.data.data.length, hasMore: !!list.data.next }
  }

  return {
    async searchTracks(query, limit = 10) {
      const page = await getList(
        '/search/track',
        { q: query, limit },
        deezerTrackSchema,
      )
      return page.items
    },

    async searchPlaylists(query, limit = 12) {
      const page = await getList(
        '/search/playlist',
        { q: query, limit },
        deezerPlaylistSchema,
      )
      return page.items
    },

    async chartPlaylists(limit = 12) {
      const page = await getList(
        '/chart/0/playlists',
        { limit },
        deezerPlaylistSchema,
      )
      return page.items
    },

    getPlaylist: (id) => getOne(`/playlist/${id}`, deezerPlaylistSchema),

    async getPlaylistTracks(id, max = 500) {
      const tracks: Array<DeezerTrack> = []
      for (let index = 0; tracks.length < max; index += PAGE_SIZE) {
        const page = await getList(
          `/playlist/${id}/tracks`,
          { index, limit: PAGE_SIZE },
          deezerTrackSchema,
        )
        tracks.push(...page.items)
        if (!page.hasMore || page.received < PAGE_SIZE) break
      }
      return tracks.slice(0, max)
    },

    getTrack: (id) => getOne(`/track/${id}`, deezerTrackSchema),
  }
}

// A track sonq can play: available in this region and with a preview clip.
export function isPlayable(track: DeezerTrack) {
  return track.readable && track.preview !== ''
}

// Accepts a bare id or a Deezer playlist link, e.g.
// https://www.deezer.com/de/playlist/1234?utm_source=… → 1234.
export function parsePlaylistId(input: string): number | null {
  const trimmed = input.trim()
  const match = /^\d+$/.test(trimmed)
    ? trimmed
    : /deezer\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?playlist\/(\d+)/i.exec(
        trimmed,
      )?.[1]
  if (!match) return null
  const id = Number(match)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
