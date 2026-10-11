import { describe, expect, test } from 'bun:test'

import { isSameSong, normalize } from './match'
import type { Track } from './types'

const track: Track = {
  id: 1,
  title: 'Bohemian Rhapsody (Remastered 2011)',
  titleShort: 'Bohemian Rhapsody',
  artist: 'Queen',
  album: 'A Night At The Opera',
  cover: '',
}

describe('normalize', () => {
  test.each([
    ['Bohemian Rhapsody', 'bohemian rhapsody'],
    ['Bohemian Rhapsody (Remastered 2011)', 'bohemian rhapsody'],
    ['Bohemian Rhapsody [Live]', 'bohemian rhapsody'],
    ['Bohemian Rhapsody - Live At Wembley Stadium', 'bohemian rhapsody'],
    ['Señorita', 'senorita'],
    ['Beyoncé', 'beyonce'],
    ['Simon & Garfunkel', 'simon and garfunkel'],
    ["Don't Stop Me Now", 'don t stop me now'],
    ['Stay feat. Justin Bieber', 'stay'],
    ['Stay (feat. Justin Bieber)', 'stay'],
    ['Stay ft. Justin Bieber', 'stay'],
    ['  99   Luftballons!  ', '99 luftballons'],
  ])('%p → %p', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })

  test('keeps words that merely start with "ft"', () => {
    expect(normalize('Fte Lifted')).toBe('fte lifted')
  })
})

describe('isSameSong', () => {
  test('matches the exact track id', () => {
    expect(isSameSong({ trackId: 1, title: 'x', artist: 'y' }, track)).toBe(
      true,
    )
  })

  test('matches another version of the same song', () => {
    const live = {
      trackId: 2,
      title: 'Bohemian Rhapsody (Live Aid)',
      artist: 'QUEEN',
    }
    expect(isSameSong(live, track)).toBe(true)
  })

  test('rejects the right title by the wrong artist', () => {
    const cover = { trackId: 3, title: 'Bohemian Rhapsody', artist: 'Panic!' }
    expect(isSameSong(cover, track)).toBe(false)
  })

  test('rejects a different song by the same artist', () => {
    const other = { trackId: 4, title: 'Under Pressure', artist: 'Queen' }
    expect(isSameSong(other, track)).toBe(false)
  })
})
