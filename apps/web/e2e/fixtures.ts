// Specs import `test` and `expect` from here. `newPlayer()` opens a fresh
// browser context per player, so players never share localStorage, and
// closes them all after the test. Contexts made from the `browser` fixture
// inherit the project's `use` options, so the mobile project's players get
// a phone viewport too.
import { test as base } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'

import { Player } from './player'

export const test = base.extend<{ newPlayer: () => Promise<Player> }>({
  newPlayer: async ({ browser }, use) => {
    const contexts: Array<BrowserContext> = []
    await use(async () => {
      const context = await browser.newContext()
      contexts.push(context)
      return new Player(await context.newPage())
    })
    await Promise.all(contexts.map((context) => context.close()))
  },
})

export { expect } from '@playwright/test'
