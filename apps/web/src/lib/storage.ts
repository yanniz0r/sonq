// localStorage access that never throws (storage can be blocked or full in
// private mode) and validates what it reads back. All keys are prefixed
// `sonq:`.
import type { z } from 'zod'

const PREFIX = 'sonq:'

export function readStorage<T>(key: string, schema: z.ZodType<T>): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Not persisted; it still works until the tab is reloaded.
  }
}

export function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clean up then.
  }
}
