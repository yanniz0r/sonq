import { expect, test } from './fixtures'

test.describe('playlist picker', () => {
  test('finds a playlist by search', async ({ newPlayer }) => {
    const host = await newPlayer()
    await host.createRoom('Alice')

    await host.playlistField().fill('e2e')
    await expect(host.page.getByText('Search results')).toBeVisible()
    await host.pickFeaturedPlaylist('E2E Hits')
  })

  test('takes a pasted Deezer link', async ({ newPlayer }) => {
    const host = await newPlayer()
    await host.createRoom('Alice')

    await host
      .playlistField()
      .fill('https://www.deezer.com/de/playlist/1?utm=x')
    await host.page.getByRole('button', { name: /Use playlist #1/ }).click()
    await expect(host.page.getByText('5 playable songs')).toBeVisible()
  })

  test('reports a link to a playlist that does not exist', async ({
    newPlayer,
  }) => {
    const host = await newPlayer()
    await host.createRoom('Alice')

    await host.playlistField().fill('https://www.deezer.com/playlist/999')
    await host.page.getByRole('button', { name: /Use playlist #999/ }).click()
    await expect(host.toast()).toHaveText(
      "That playlist doesn't exist or isn't public.",
    )
  })

  test('is only shown to the host', async ({ newPlayer }) => {
    const host = await newPlayer()
    const guest = await newPlayer()
    const code = await host.createRoom('Alice')
    await guest.joinByLink(code, 'Bob')

    await guest.expectPlayers('Alice', 'Bob')
    await expect(guest.playlistField()).toBeHidden()
    await expect(
      guest.page.getByRole('button', { name: 'Start game' }),
    ).toBeHidden()
  })
})

test('the host role passes on when the host leaves', async ({ newPlayer }) => {
  const host = await newPlayer()
  const guest = await newPlayer()
  const code = await host.createRoom('Alice')
  await guest.joinByLink(code, 'Bob')
  await guest.expectHost('Alice')

  await host.leave()

  await guest.expectHost('Bob')
  await expect(guest.page.getByText('Alice')).toBeHidden()
  await expect(guest.playlistField()).toBeVisible()
})

test('the host role passes on when the host walks away', async ({
  newPlayer,
}) => {
  const host = await newPlayer()
  const guest = await newPlayer()
  const code = await host.createRoom('Alice')
  await guest.joinByLink(code, 'Bob')
  await guest.expectHost('Alice')

  await host.close()
  await guest.expectOffline('Alice')
  // Disconnect grace plus host timeout (1 s + 2 s with fast timers).
  await guest.expectHost('Bob', 10_000)
  await expect(guest.playlistField()).toBeVisible()
})
