import { describe, expect, test } from 'bun:test'
import { DeezerError } from '@sonq/deezer'
import type { DeezerClient, DeezerPlaylist, DeezerTrack } from '@sonq/deezer'

import { createLogger } from './log.server'
import { createMusic } from './music.server'

function deezerTrack(id: number, overrides: Partial<DeezerTrack> = {}) {
  return {
    id,
    readable: true,
    title: `Song ${id} (Live)`,
    title_short: `Song ${id}`,
    preview: `https://cdn.test/${id}.mp3`,
    rank: 1,
    duration: 200,
    artist: { id: 1, name: 'Artist' },
    album: { id: 1, title: 'Album', cover_medium: 'm.jpg', cover_big: 'b.jpg' },
    ...overrides,
  } satisfies DeezerTrack
}

const info: DeezerPlaylist = {
  id: 7,
  title: 'Hits',
  nb_tracks: 3,
  picture_medium: 'pm.jpg',
  picture_big: 'pb.jpg',
}

const unused = () => Promise.reject(new Error('not used in this test'))

function fakeDeezer(overrides: Partial<DeezerClient>): DeezerClient {
  return {
    searchTracks: unused,
    searchPlaylists: unused,
    chartPlaylists: unused,
    getPlaylist: unused,
    getPlaylistTracks: unused,
    getTrack: unused,
    ...overrides,
  }
}

describe('loadPlaylist', () => {
  test('keeps playable tracks only, once each', async () => {
    const music = createMusic(
      fakeDeezer({
        getPlaylist: async () => info,
        getPlaylistTracks: async () => [
          deezerTrack(1),
          deezerTrack(1),
          deezerTrack(2, { preview: '' }),
          deezerTrack(3, { readable: false }),
          deezerTrack(4),
        ],
      }),
    )
    const result = await music.loadPlaylist(7)
    if (!result.ok) throw new Error(result.error)

    expect(result.playlist).toMatchObject({
      id: 7,
      title: 'Hits',
      cover: 'pb.jpg',
    })
    expect(result.playlist.tracks.map((t) => t.id)).toEqual([1, 4])
    expect(result.playlist.tracks[0]).toEqual({
      id: 1,
      title: 'Song 1 (Live)',
      titleShort: 'Song 1',
      artist: 'Artist',
      album: 'Album',
      cover: 'm.jpg',
    })
  })

  test('reports a playlist without playable tracks', async () => {
    const music = createMusic(
      fakeDeezer({
        getPlaylist: async () => info,
        getPlaylistTracks: async () => [deezerTrack(1, { preview: '' })],
      }),
    )
    expect(await music.loadPlaylist(7)).toEqual({
      ok: false,
      error: 'playlist_empty',
    })
  })

  test('maps Deezer errors', async () => {
    const failWith = (kind: 'not_found' | 'quota_exceeded') =>
      createMusic(
        fakeDeezer({
          getPlaylist: () => Promise.reject(new DeezerError(kind, kind)),
          getPlaylistTracks: async () => [],
        }),
      ).loadPlaylist(7)

    expect(await failWith('not_found')).toEqual({
      ok: false,
      error: 'playlist_not_found',
    })
    expect(await failWith('quota_exceeded')).toEqual({
      ok: false,
      error: 'music_unavailable',
    })
  })

  test('lets programming errors through', async () => {
    const music = createMusic(
      fakeDeezer({ searchTracks: () => Promise.reject(new TypeError('bug')) }),
    )
    expect(music.searchTracks('x')).rejects.toThrow('bug')
  })
})

describe('searchTracks', () => {
  test('caches by normalized query', async () => {
    let calls = 0
    const music = createMusic(
      fakeDeezer({
        searchTracks: async () => {
          calls++
          return [deezerTrack(1)]
        },
      }),
    )
    await music.searchTracks('Queen')
    const result = await music.searchTracks('  queen ')
    expect(result).toMatchObject({ ok: true, tracks: [{ id: 1 }] })
    expect(calls).toBe(1)
  })
})

describe('previewUrl', () => {
  test('returns a fresh preview URL, or null without one', async () => {
    const music = createMusic(
      fakeDeezer({
        getTrack: async (id) =>
          deezerTrack(id, id === 2 ? { preview: '' } : {}),
      }),
    )
    expect(await music.previewUrl(1)).toBe('https://cdn.test/1.mp3')
    expect(await music.previewUrl(2)).toBeNull()
  })

  test('returns null when Deezer is down', async () => {
    const music = createMusic(
      fakeDeezer({
        getTrack: () => Promise.reject(new DeezerError('unavailable', 'down')),
      }),
    )
    expect(await music.previewUrl(1)).toBeNull()
  })
})

describe('logging', () => {
  test('logs real Deezer requests and failures, but not cache hits', async () => {
    const lines: Array<string> = []
    const log = createLogger('deezer', {
      level: 'debug',
      write: (line) => lines.push(line),
    })
    const music = createMusic(
      fakeDeezer({
        searchTracks: async () => [deezerTrack(1)],
        getTrack: () =>
          Promise.reject(new DeezerError('quota_exceeded', 'Quota')),
      }),
      log,
    )
    await music.searchTracks('queen')
    await music.searchTracks('queen')
    await music.previewUrl(1)

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(
      /DEBUG deezer\s+request request=searchTracks query=queen ms=\d+ results=1$/,
    )
    expect(lines[1]).toMatch(
      /WARN {2}deezer\s+request failed request=getTrack id=1 ms=\d+ kind=quota_exceeded error=Quota$/,
    )
  })
})
