// Minimal structured logging for the server, one logfmt line per event:
//
//   12:03:41.207 DEBUG rooms   dispatch code=ABCD action=command:guess result=ok
//
// Fields only take primitives, so whole objects (a Room carries player
// secrets) can't end up in a log line by accident. The level comes from
// LOG_LEVEL (debug | info | warn | error | silent); it defaults to debug in
// development, info in production and silent under tests (tests that check
// logs inject their own logger).
import { z } from 'zod'

const LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const
const levelSchema = z.enum(LEVELS)

export type LogLevel = z.infer<typeof levelSchema>
export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>
type LogMethod = (message: string, fields?: LogFields) => void

export interface Logger {
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: LogMethod
}

export interface LoggerOptions {
  level?: LogLevel
  write?: (line: string, level: Exclude<LogLevel, 'silent'>) => void
  now?: () => Date
}

export function createLogger(
  scope: string,
  {
    level = configuredLevel(),
    write = writeToConsole,
    now = () => new Date(),
  }: LoggerOptions = {},
): Logger {
  const threshold = LEVELS.indexOf(level)
  const method =
    (methodLevel: Exclude<LogLevel, 'silent'>): LogMethod =>
    (message, fields = {}) => {
      if (LEVELS.indexOf(methodLevel) < threshold) return
      const line = [
        now().toISOString().slice(11, 23),
        methodLevel.toUpperCase().padEnd(5),
        scope.padEnd(7),
        message,
        formatFields(fields),
      ]
        .filter(Boolean)
        .join(' ')
      write(line, methodLevel)
    }

  return {
    debug: method('debug'),
    info: method('info'),
    warn: method('warn'),
    error: method('error'),
  }
}

export function formatFields(fields: LogFields): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value ?? null)}`)
    .join(' ')
}

function formatValue(value: string | number | boolean | null): string {
  if (typeof value !== 'string') return String(value)
  return /^[^\s"=]+$/.test(value) ? value : JSON.stringify(value)
}

function configuredLevel(): LogLevel {
  const fromEnv = levelSchema.safeParse(process.env.LOG_LEVEL?.toLowerCase())
  if (fromEnv.success) return fromEnv.data
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info'
    case 'test':
      return 'silent'
    default:
      return 'debug'
  }
}

function writeToConsole(line: string, level: Exclude<LogLevel, 'silent'>) {
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}
