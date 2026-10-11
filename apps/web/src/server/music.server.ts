// Everything sonq needs from Deezer, cached and mapped to game types. Deezer
// failures become typed `Result` errors; anything else is a bug and throws.
import { DeezerError, createDeezerClient, isPlayable } from '@sonq/deezer'
import type { DeezerClient, DeezerPlaylist, DeezerTrack } from '@sonq/deezer'
import type { GameError, Playlist, Result, Track } from '@sonq/game'

import { createFakeDeezerClient } from './fake-deezer.server'
import { createTtlCache } from './ttl-cache'

export interface PlaylistHit {
  id: number
  title: string
  cover: string
  trackCount: number
  owner: string | null
}

export interface Music {
  searchTracks: (query: string) => Promise<Result<{ tracks: Array<Track> }>>
  searchPlaylists: (
    query: string,
  ) => Promise<Result<{ playlists: Array<PlaylistHit> }>>
  featuredPlaylists: () => Promise<Result<{ playlists: Array<PlaylistHit> }>>
  loadPlaylist: (id: number) => Promise<Result<{ playlist: Playlist }>>
  // A fresh, signed preview URL. They expire, so never store one.
  previewUrl: (trackId: number) => Promise<string | null>
}

const MINUTE = 60_000
const MAX_PLAYLIST_TRACKS = 500
const SEARCH_LIMIT = 8

export function createMusic(deezer: DeezerClient): Music {
  const trackSearches = createTtlCache<Array<Track>>({ ttlMs: 10 * MINUTE })
  const playlistSearches = createTtlCache<Array<PlaylistHit>>({
    ttlMs: 10 * MINUTE,
  })
  const featured = createTtlCache<Array<PlaylistHit>>({
    ttlMs: 60 * MINUTE,
    maxEntries: 1,
  })
  const playlists = createTtlCache<{
    info: DeezerPlaylist
    tracks: Array<Track>
  }>({ ttlMs: 60 * MINUTE, maxEntries: 50 })
  // Deezer signs preview URLs for ~15 minutes; 5 leaves plenty of margin.
  const previews = createTtlCache<string>({ ttlMs: 5 * MINUTE })

  return {
    searchTracks: (query) =>
      attempt('music_unavailable', async () => {
        const tracks = await trackSearches.get(cacheKey(query), async () =>
          (await deezer.searchTracks(query, SEARCH_LIMIT)).map(toTrack),
        )
        return { tracks }
      }),

    searchPlaylists: (query) =>
      attempt('music_unavailable', async () => {
        const hits = await playlistSearches.get(cacheKey(query), async () =>
          (await deezer.searchPlaylists(query)).map(toPlaylistHit),
        )
        return { playlists: hits }
      }),

    featuredPlaylists: () =>
      attempt('music_unavailable', async () => {
        const hits = await featured.get('chart', async () =>
          (await deezer.chartPlaylists()).map(toPlaylistHit),
        )
        return { playlists: hits }
      }),

    loadPlaylist: async (id) => {
      const loaded = await attempt('playlist_not_found', async () =>
        playlists.get(String(id), async () => {
          const [info, tracks] = await Promise.all([
            deezer.getPlaylist(id),
            deezer.getPlaylistTracks(id, MAX_PLAYLIST_TRACKS),
          ])
          return {
            info,
            tracks: uniqueById(tracks.filter(isPlayable).map(toTrack)),
          }
        }),
      )
      if (!loaded.ok) return loaded
      const [first, ...rest] = loaded.tracks
      if (!first) return { ok: false, error: 'playlist_empty' }
      return {
        ok: true,
        playlist: {
          id: loaded.info.id,
          title: loaded.info.title,
          cover: loaded.info.picture_big,
          tracks: [first, ...rest],
        },
      }
    },

    previewUrl: async (trackId) => {
      const result = await attempt('music_unavailable', async () => ({
        url: await previews.get(String(trackId), async () => {
          const track = await deezer.getTrack(trackId)
          return track.preview
        }),
      }))
      return result.ok && result.url ? result.url : null
    },
  }
}

export function toTrack(track: DeezerTrack): Track {
  return {
    id: track.id,
    title: track.title,
    titleShort: track.title_short,
    artist: track.artist.name,
    album: track.album.title,
    cover: track.album.cover_medium,
  }
}

function toPlaylistHit(playlist: DeezerPlaylist): PlaylistHit {
  return {
    id: playlist.id,
    title: playlist.title,
    cover: playlist.picture_medium,
    trackCount: playlist.nb_tracks,
    owner: (playlist.user ?? playlist.creator)?.name ?? null,
  }
}

// Turns Deezer errors into a `Result`; a missing resource maps to
// `notFound`, everything else (quota, outage) to `music_unavailable`.
async function attempt<T extends object>(
  notFound: GameError,
  run: () => Promise<T>,
): Promise<Result<T>> {
  try {
    return { ok: true, ...(await run()) }
  } catch (error) {
    if (!(error instanceof DeezerError)) throw error
    return {
      ok: false,
      error: error.kind === 'not_found' ? notFound : 'music_unavailable',
    }
  }
}

function cacheKey(query: string) {
  return query.trim().toLowerCase()
}

function uniqueById(tracks: Array<Track>) {
  return [...new Map(tracks.map((t) => [t.id, t])).values()]
}

// One client and one set of caches per process, kept across HMR reloads.
// DEEZER_FAKE=1 swaps in an offline catalog for e2e tests.
const g = globalThis as typeof globalThis & { __sonqMusic?: Music }
export const music: Music = (g.__sonqMusic ??= createMusic(
  process.env.DEEZER_FAKE === '1'
    ? createFakeDeezerClient()
    : createDeezerClient(),
))
