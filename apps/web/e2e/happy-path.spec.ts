import { expect, test } from './fixtures'

test('two players play a round from lobby to recap and back', async ({
  newPlayer,
}) => {
  const host = await newPlayer()
  const guest = await newPlayer()

  const code = await host.createRoom('Alice')
  await guest.joinByLink(code, 'Bob')
  await host.expectPlayers('Alice', 'Bob')
  await guest.expectPlayers('Alice', 'Bob')
  await expect(
    guest.page.getByText('Waiting for the host to pick a playlist…'),
  ).toBeVisible()

  await host.pickFeaturedPlaylist('E2E Hits')
  await expect(guest.page.getByText('E2E Hits')).toBeVisible()
  await host.setRounds(5)
  await host.start()

  await expect(guest.page.getByText('Round 1 of 5')).toBeVisible()

  // A wrong guess is listed and crossed out, then the right one counts.
  await guest.guess('decoy', 'Decoy Song')
  await expect(
    guest.page.getByRole('list', { name: 'Your wrong guesses' }),
  ).toContainText('Decoy Song')
  await guest.page.waitForTimeout(2_100) // guess cooldown
  await guest.guess('test', 'Test Song')
  await expect(guest.heading('You got it! 🎉')).toBeVisible()

  // Once everyone found it, the round is revealed early.
  await host.guess('test', 'Test Song')
  await expect(host.heading(/Test Song/)).toBeVisible()
  await expect(guest.heading(/Test Song/)).toBeVisible()

  await host.page.getByRole('button', { name: 'End game' }).click()
  await expect(guest.heading(/wins! 🏆/)).toBeVisible()
  await expect(guest.page.getByText('2/2 found it')).toBeVisible()

  await host.page.getByRole('button', { name: 'Play again' }).click()
  await expect(
    guest.page.getByText('Waiting for the host to start…'),
  ).toBeVisible()
})

test('a reload keeps the player in their seat', async ({ newPlayer }) => {
  const host = await newPlayer()
  const code = await host.createRoom('Alice')
  await host.page.reload()
  await host.page.locator('html[data-hydrated]').waitFor()
  await expect(host.page.getByText(`ROOM ${code}`)).toBeVisible()
  await host.expectPlayers('Alice')
})

test('an unknown room asks for a name, then reports it is gone', async ({
  newPlayer,
}) => {
  const player = await newPlayer()
  await player.joinByLink('ZZZZ', 'Bob')
  await expect(
    player.page.getByText("This room doesn't exist (anymore)."),
  ).toBeVisible()
})
