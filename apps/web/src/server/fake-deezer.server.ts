// An offline stand-in for Deezer, enabled with DEEZER_FAKE=1 (e2e tests,
// offline development). Every track in its playlists is a different
// version of the same song, so a test can guess right without knowing which
// one is playing; the decoy is always wrong.
import { DeezerError } from '@sonq/deezer'
import type { DeezerClient, DeezerPlaylist, DeezerTrack } from '@sonq/deezer'

export const FAKE_SONG = { title: 'Test Song', artist: 'Test Artist' }
export const FAKE_DECOY = { title: 'Decoy Song', artist: 'Decoy Artist' }

const track = (
  id: number,
  { title, artist }: { title: string; artist: string },
): DeezerTrack => ({
  id,
  readable: true,
  title: `${title} (Version ${id})`,
  title_short: title,
  // Not a real file; the game works without audio.
  preview: `/fake-preview/${id}.mp3`,
  rank: 1,
  duration: 30,
  artist: { id: 1, name: artist },
  album: { id: 1, title: 'Fixtures', cover_medium: '', cover_big: '' },
})

const SONGS = [1, 2, 3, 4, 5].map((id) => track(id, FAKE_SONG))
const DECOY = track(99, FAKE_DECOY)

const playlist = (
  id: number,
  title: string,
  tracks: Array<DeezerTrack>,
): { info: DeezerPlaylist; tracks: Array<DeezerTrack> } => ({
  info: {
    id,
    title,
    nb_tracks: tracks.length,
    picture_medium: '',
    picture_big: '',
    user: { name: 'sonq' },
  },
  tracks,
})

const PLAYLISTS = [
  playlist(1, 'E2E Hits', SONGS),
  // Caps a game at two rounds, for tests that play one to its end.
  playlist(2, 'E2E Duo', SONGS.slice(0, 2)),
]

const matches = (query: string, ...texts: Array<string>) =>
  texts.some((t) => t.toLowerCase().includes(query.toLowerCase()))

export function createFakeDeezerClient(): DeezerClient {
  return {
    searchTracks: async (query) =>
      [...SONGS, DECOY].filter((t) => matches(query, t.title, t.artist.name)),
    searchPlaylists: async (query) =>
      PLAYLISTS.filter((p) => matches(query, p.info.title)).map((p) => p.info),
    chartPlaylists: async () => PLAYLISTS.map((p) => p.info),
    getPlaylist: async (id) => {
      const found = PLAYLISTS.find((p) => p.info.id === id)
      if (!found) throw new DeezerError('not_found', 'no data')
      return found.info
    },
    getPlaylistTracks: async (id) =>
      PLAYLISTS.find((p) => p.info.id === id)?.tracks ?? [],
    getTrack: async (id) => {
      const found = [...SONGS, DECOY].find((t) => t.id === id)
      if (!found) throw new DeezerError('not_found', 'no data')
      return found
    },
  }
}
