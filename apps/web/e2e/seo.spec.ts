import { expect, test } from './fixtures'

// What crawlers and link previews read, from the server-rendered HTML.

test('the home page describes the game to search engines', async ({ page }) => {
  await page.goto('/')
  const head = page.locator('head')

  await expect(page).toHaveTitle(/Song Guessing Game/)
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://sonq.de/',
  )
  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://sonq.de/og.png',
  )
  await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible()

  const structuredData = await head
    .locator('script[type="application/ld+json"]')
    .textContent()
  expect(JSON.parse(structuredData ?? '')).toMatchObject({
    '@context': 'https://schema.org',
  })
})

test('room invites get a preview but stay out of the index', async ({
  page,
}) => {
  await page.goto('/r/abcd')
  const head = page.locator('head')

  await expect(head.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Join room ABCD – sonq',
  )
  await expect(head.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex',
  )
})

test('robots.txt, the sitemap and the manifest are served', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt')
  expect(await robots.text()).toContain('Sitemap: https://sonq.de/sitemap.xml')

  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('<loc>https://sonq.de/</loc>')

  const manifest = await request.get('/manifest.webmanifest')
  expect(await manifest.json()).toMatchObject({ name: 'sonq' })

  for (const asset of ['/favicon.ico', '/og.png', '/apple-touch-icon.png'])
    expect((await request.get(asset)).ok()).toBe(true)
})
