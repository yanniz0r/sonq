import { expect, test } from './fixtures'

test('each round loads its preview through the audio redirect', async ({
  newPlayer,
}) => {
  const host = await newPlayer()
  const code = await host.createRoom('Alice')
  await host.pickFeaturedPlaylist('E2E Hits')

  const audio = host.waitForAudio(code, 0)
  await host.start()
  const response = await audio

  expect(response.status()).toBe(302)
  // The fake catalog's previews live at /fake-preview/<track id>.mp3.
  expect(response.headers()['location']).toMatch(/^\/fake-preview\/\d+\.mp3$/)
})

test('a player who joins mid-game can guess right away', async ({
  newPlayer,
}) => {
  const host = await newPlayer()
  const latecomer = await newPlayer()
  const code = await host.createRoom('Alice')
  await host.pickFeaturedPlaylist('E2E Hits')
  await host.start()
  await expect(host.page.getByText('Round 1 of 5')).toBeVisible()

  await latecomer.joinByLink(code, 'Bob')
  await expect(latecomer.page.getByText('Round 1 of 5')).toBeVisible()
  await latecomer.guess('test', 'Test Song')
  await expect(latecomer.heading('You got it! 🎉')).toBeVisible()
  await expect(
    host.page.getByRole('listitem').filter({ hasText: 'Bob' }),
  ).toContainText('✅')
})

// The e2e server runs with SONQ_FAST_TIMERS=1: 1 s countdown, 10 s rounds,
// 3 s reveals, 1 s disconnect grace, 2 s host timeout.

test('a game runs by itself from the first round to the results', async ({
  newPlayer,
}) => {
  test.setTimeout(60_000)
  const host = await newPlayer()
  await host.createRoom('Alice')
  await host.pickFeaturedPlaylist('E2E Duo')
  await host.start()

  // Nobody guesses: the round ends when its time is up.
  await expect(host.page.getByText('Round 1 of 2')).toBeVisible()
  await expect(host.heading(/Test Song/)).toBeVisible({ timeout: 15_000 })
  await expect(host.page.getByText("You didn't get this one.")).toBeVisible()

  // The reveal moves on to the next round by itself.
  await expect(host.page.getByText('Round 2 of 2')).toBeVisible({
    timeout: 6_000,
  })
  await host.guess('test', 'Test Song')
  await expect(host.heading(/Test Song/)).toBeVisible()

  // After the last reveal, the results come up without anyone clicking.
  await expect(host.heading('Alice wins! 🏆')).toBeVisible({ timeout: 6_000 })
  await expect(host.page.getByText('1/1 found it')).toHaveCount(1)
})

test('a player who walks away stops holding up the round', async ({
  newPlayer,
}) => {
  const host = await newPlayer()
  const guest = await newPlayer()
  const code = await host.createRoom('Alice')
  await guest.joinByLink(code, 'Bob')
  await host.pickFeaturedPlaylist('E2E Hits')
  await host.start()
  await expect(guest.page.getByText('Round 1 of 5')).toBeVisible()

  await guest.close()
  await host.expectOffline('Bob')

  // Everyone still connected found it, so the round is revealed right away
  // instead of when its 10 s are up.
  await host.guess('test', 'Test Song')
  await expect(host.heading(/Test Song/)).toBeVisible({ timeout: 3_000 })
})
