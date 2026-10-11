import { describe, expect, test } from 'bun:test'

import {
  DeezerError,
  createDeezerClient,
  isPlayable,
  parsePlaylistId,
} from './client'
import chartPlaylists from './fixtures/chart-playlists.json'
import errorNoData from './fixtures/error-no-data.json'
import playlist from './fixtures/playlist.json'
import playlistTracks from './fixtures/playlist-tracks.json'
import searchPlaylists from './fixtures/search-playlists.json'
import searchTracks from './fixtures/search-tracks.json'
import track from './fixtures/track.json'

type Routes = Record<string, unknown>

// A fetch that serves recorded responses by path and records every URL.
function fakeFetch(routes: Routes) {
  const calls: Array<URL> = []
  const fetch = async (raw: string) => {
    const url = new URL(raw)
    calls.push(url)
    if (!(url.pathname in routes)) return new Response('nope', { status: 404 })
    return Response.json(routes[url.pathname])
  }
  return { fetch, calls }
}

const client = (routes: Routes) => createDeezerClient(fakeFetch(routes))

async function expectDeezerError(promise: Promise<unknown>, kind: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(DeezerError)
  expect(error).toMatchObject({ kind })
}

describe('createDeezerClient', () => {
  test('searchTracks parses tracks and sends the query', async () => {
    const { fetch, calls } = fakeFetch({ '/search/track': searchTracks })
    const tracks = await createDeezerClient({ fetch }).searchTracks('queen', 4)

    expect(calls[0]?.searchParams.get('q')).toBe('queen')
    expect(calls[0]?.searchParams.get('limit')).toBe('4')
    expect(tracks).toHaveLength(searchTracks.data.length)
    expect(tracks[0]).toMatchObject({
      title_short: 'Bohemian Rhapsody',
      artist: { name: 'Queen' },
    })
  })

  test('drops malformed list items instead of failing', async () => {
    const tracks = await client({
      '/search/track': { data: [track, null, { id: 'broken' }] },
    }).searchTracks('x')
    expect(tracks.map((t) => t.id)).toEqual([track.id])
  })

  test('searchPlaylists and chartPlaylists parse playlists', async () => {
    const deezer = client({
      '/search/playlist': searchPlaylists,
      '/chart/0/playlists': chartPlaylists,
    })
    const [found] = await deezer.searchPlaylists('90s')
    const [charted] = await deezer.chartPlaylists()
    expect(found?.user?.name).toBeString()
    expect(charted?.nb_tracks).toBeGreaterThan(0)
  })

  test('getPlaylist reads the creator of a single playlist', async () => {
    const result = await client({
      '/playlist/3155776842': playlist,
    }).getPlaylist(3155776842)
    expect(result).toMatchObject({ title: 'Top Worldwide' })
    expect(result.creator?.name).toBe('Deezer Charts')
  })

  test('getPlaylistTracks follows pagination up to the maximum', async () => {
    const page = { ...playlistTracks, data: Array(100).fill(track) }
    const { fetch, calls } = fakeFetch({ '/playlist/1/tracks': page })
    const tracks = await createDeezerClient({ fetch }).getPlaylistTracks(1, 250)

    expect(tracks).toHaveLength(250)
    expect(calls.map((c) => c.searchParams.get('index'))).toEqual([
      '0',
      '100',
      '200',
    ])
  })

  test('getPlaylistTracks stops at the last page', async () => {
    const { fetch, calls } = fakeFetch({ '/playlist/1/tracks': playlistTracks })
    const last = { ...playlistTracks, next: undefined }
    const tracks = await createDeezerClient({
      fetch: async (url) => {
        await fetch(url)
        return Response.json(last)
      },
    }).getPlaylistTracks(1)
    expect(tracks).toHaveLength(playlistTracks.data.length)
    expect(calls).toHaveLength(1)
  })

  test('getTrack returns a single track', async () => {
    const result = await client({ '/track/4091937401': track }).getTrack(
      4091937401,
    )
    expect(result.preview).toStartWith('https://')
  })

  test('maps Deezer error bodies to typed errors', async () => {
    await expectDeezerError(
      client({ '/track/1': errorNoData }).getTrack(1),
      'not_found',
    )
    await expectDeezerError(
      client({
        '/track/1': {
          error: { type: 'Exception', message: 'Quota', code: 4 },
        },
      }).getTrack(1),
      'quota_exceeded',
    )
  })

  test('maps transport failures and unexpected shapes', async () => {
    await expectDeezerError(client({}).getTrack(1), 'unavailable')
    await expectDeezerError(
      createDeezerClient({
        fetch: () => Promise.reject(new Error('offline')),
      }).getTrack(1),
      'unavailable',
    )
    await expectDeezerError(
      client({ '/track/1': { id: 1 } }).getTrack(1),
      'invalid_response',
    )
  })
})

describe('isPlayable', () => {
  test('needs a readable track with a preview', async () => {
    const parsed = await client({ '/track/1': track }).getTrack(1)
    expect(isPlayable(parsed)).toBe(true)
    expect(isPlayable({ ...parsed, preview: '' })).toBe(false)
    expect(isPlayable({ ...parsed, readable: false })).toBe(false)
  })
})

describe('parsePlaylistId', () => {
  test.each([
    ['1234', 1234],
    [' 1234 ', 1234],
    ['https://www.deezer.com/playlist/1234', 1234],
    ['https://www.deezer.com/de/playlist/1234?utm_source=x', 1234],
    ['deezer.com/en-gb/playlist/987', 987],
  ])('%p → %p', (input, expected) => {
    expect(parsePlaylistId(input)).toBe(expected)
  })

  test.each(['', 'abc', 'https://www.deezer.com/album/1234', '0'])(
    'rejects %p',
    (input) => {
      expect(parsePlaylistId(input)).toBeNull()
    },
  )
})
