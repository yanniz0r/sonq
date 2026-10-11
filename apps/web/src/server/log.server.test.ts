import { describe, expect, test } from 'bun:test'

import { createLogger, formatFields } from './log.server'
import type { LogLevel } from './log.server'

function capture(level: LogLevel) {
  const lines: Array<string> = []
  const log = createLogger('rooms', {
    level,
    write: (line) => lines.push(line),
    now: () => new Date('2026-10-11T12:03:41.207Z'),
  })
  return { log, lines }
}

describe('createLogger', () => {
  test('writes one line with time, level, scope, message and fields', () => {
    const { log, lines } = capture('debug')
    log.debug('dispatch', { code: 'ABCD', ok: true, version: 3 })
    expect(lines).toEqual([
      '12:03:41.207 DEBUG rooms   dispatch code=ABCD ok=true version=3',
    ])
  })

  test('drops messages below the configured level', () => {
    const { log, lines } = capture('warn')
    log.debug('a')
    log.info('b')
    log.warn('c')
    log.error('d')
    expect(lines.map((l) => l.split(' ').at(-1))).toEqual(['c', 'd'])
  })

  test('silent writes nothing', () => {
    const { log, lines } = capture('silent')
    log.error('boom')
    expect(lines).toEqual([])
  })
})

describe('formatFields', () => {
  test('quotes values with spaces or quotes and skips undefined', () => {
    expect(
      formatFields({
        guess: 'Bohemian Rhapsody — Queen',
        quote: 'say "hi"',
        none: null,
        skipped: undefined,
      }),
    ).toBe('guess="Bohemian Rhapsody — Queen" quote="say \\"hi\\"" none=null')
  })
})
