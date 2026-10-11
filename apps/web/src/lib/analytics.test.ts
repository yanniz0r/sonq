import { describe, expect, test } from 'bun:test'

import { analyticsPath, analyticsReferrer } from './analytics'

describe('analyticsPath', () => {
  test('collapses rooms into one page', () => {
    expect(analyticsPath('/r/ABCD')).toBe('/r/:code')
  })

  test('leaves other pages alone', () => {
    expect(analyticsPath('/')).toBe('/')
    expect(analyticsPath('/rooms')).toBe('/rooms')
  })
})

describe('analyticsReferrer', () => {
  const origin = 'https://sonq.de'

  test('keeps only origin and path of other sites', () => {
    expect(
      analyticsReferrer('https://www.google.com/search?q=sonq#top', origin),
    ).toBe('https://www.google.com/search')
  })

  test('turns our own pages into clean paths', () => {
    expect(analyticsReferrer('https://sonq.de/r/WXYZ?x=1', origin)).toBe(
      '/r/:code',
    )
  })

  test('is empty without a referrer', () => {
    expect(analyticsReferrer('', origin)).toBe('')
  })
})
