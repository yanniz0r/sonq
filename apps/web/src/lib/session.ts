// What the browser remembers between visits: the seat in each room (so a
// reload puts the player back into it), their name and their volume.
import { playerNameSchema } from '@sonq/game'
import { z } from 'zod'

import { credentialsSchema } from './credentials'
import type { Credentials } from './credentials'
import { readStorage, removeStorage, writeStorage } from './storage'

const roomKey = (code: string) => `room:${code}`

export function loadCredentials(code: string): Credentials | null {
  const credentials = readStorage(roomKey(code), credentialsSchema)
  return credentials?.code === code ? credentials : null
}

export const saveCredentials = (credentials: Credentials) =>
  writeStorage(roomKey(credentials.code), credentials)

export const clearCredentials = (code: string) => removeStorage(roomKey(code))

export const loadName = () => readStorage('name', playerNameSchema) ?? ''
export const saveName = (name: string) => writeStorage('name', name)

const volumeSchema = z.number().min(0).max(1)
export const DEFAULT_VOLUME = 0.8
export const loadVolume = () =>
  readStorage('volume', volumeSchema) ?? DEFAULT_VOLUME
export const saveVolume = (volume: number) => writeStorage('volume', volume)
