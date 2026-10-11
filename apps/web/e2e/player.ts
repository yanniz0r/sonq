// One browser page acting as one player. Specs talk to the game through
// these methods, so locators live in one place.
import { expect } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

export class Player {
  private constructor(readonly page: Page) {}

  static async open(browser: Browser) {
    const context = await browser.newContext()
    return new Player(await context.newPage())
  }

  async goto(path: string) {
    await this.page.goto(path)
    // Server-rendered buttons do nothing until React has hydrated.
    await this.page.locator('html[data-hydrated]').waitFor()
  }

  async createRoom(name: string): Promise<string> {
    await this.goto('/')
    await this.page.getByLabel('Your name').fill(name)
    await this.page.getByRole('button', { name: 'Create room' }).click()
    await this.page.waitForURL(/\/r\/[A-Z]{4}$/)
    return this.page.url().slice(-4)
  }

  async joinByLink(code: string, name: string) {
    await this.goto(`/r/${code}`)
    await this.page.getByLabel('Your name').fill(name)
    await this.page.getByRole('button', { name: 'Join room' }).click()
  }

  heading(name: string | RegExp) {
    return this.page.getByRole('heading', { name })
  }

  async expectPlayers(...names: Array<string>) {
    for (const name of names) {
      await expect(
        this.page.getByRole('listitem').filter({ hasText: name }).first(),
      ).toBeVisible()
    }
  }

  async pickFeaturedPlaylist(title: string) {
    await this.page.getByRole('button', { name: new RegExp(title) }).click()
    await expect(this.page.getByText(/playable songs/)).toBeVisible()
  }

  async setRounds(rounds: number) {
    await this.page
      .getByRole('group', { name: 'Rounds' })
      .getByRole('button', { name: String(rounds), exact: true })
      .click()
  }

  async start() {
    await this.page.getByRole('button', { name: 'Start game' }).click()
  }

  async guess(query: string, title: string) {
    const search = this.page.getByLabel('Search by title or artist')
    await expect(search).toBeVisible({ timeout: 10_000 })
    await search.fill(query)
    await this.page
      .getByRole('button', { name: new RegExp(title) })
      .first()
      .click()
  }
}
