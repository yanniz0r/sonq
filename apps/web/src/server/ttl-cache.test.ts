import { describe, expect, test } from 'bun:test'

import { createTtlCache } from './ttl-cache'

function setup(maxEntries = 10) {
  let time = 0
  let loads = 0
  const cache = createTtlCache<string>({
    ttlMs: 1000,
    maxEntries,
    now: () => time,
  })
  const load = (value: string) => () => {
    loads++
    return Promise.resolve(value)
  }
  return {
    cache,
    load,
    loads: () => loads,
    advance: (ms: number) => (time += ms),
  }
}

describe('createTtlCache', () => {
  test('serves cached values until they expire', async () => {
    const { cache, load, loads, advance } = setup()
    expect(await cache.get('a', load('1'))).toBe('1')
    advance(999)
    expect(await cache.get('a', load('2'))).toBe('1')
    advance(1)
    expect(await cache.get('a', load('3'))).toBe('3')
    expect(loads()).toBe(2)
  })

  test('shares one in-flight load between concurrent callers', async () => {
    const { cache, load, loads } = setup()
    const [a, b] = await Promise.all([
      cache.get('a', load('1')),
      cache.get('a', load('2')),
    ])
    expect([a, b]).toEqual(['1', '1'])
    expect(loads()).toBe(1)
  })

  test('does not cache failures', async () => {
    const { cache, load } = setup()
    const failing = cache.get('a', () => Promise.reject(new Error('down')))
    expect(failing).rejects.toThrow('down')
    await failing.catch(() => {})
    expect(await cache.get('a', load('ok'))).toBe('ok')
  })

  test('evicts the oldest entry when full', async () => {
    const { cache, load, loads } = setup(2)
    await cache.get('a', load('a'))
    await cache.get('b', load('b'))
    await cache.get('c', load('c'))
    await cache.get('b', load('b'))
    expect(loads()).toBe(3)
    await cache.get('a', load('a'))
    expect(loads()).toBe(4)
  })
})
