// Decides whether a guess names the song that is playing. Players pick their
// guess from Deezer search results, which list the same song many times
// (album, single, remaster, live …). Any version counts, so titles and
// artists are compared after normalization rather than by track id alone.
import type { Track } from './types'

export interface SongRef {
  trackId: number
  title: string
  artist: string
}

export function isSameSong(guess: SongRef, track: Track): boolean {
  if (guess.trackId === track.id) return true
  return (
    normalize(guess.title) === normalize(track.titleShort) &&
    normalize(guess.artist) === normalize(track.artist)
  )
}

export function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // diacritics
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, ' ') // "(Remastered 2011)", "[Live]"
    .replace(/\s+-\s+.*$/, '') // " - Radio Edit", " - Live at Wembley"
    .replace(/\b(?:feat|ft|featuring)\b\.?.*$/, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}
