import { createFileRoute } from '@tanstack/react-router'

import { BACKGROUND_COLOR, SITE_DESCRIPTION, SITE_NAME } from '#/lib/site'

const MANIFEST = {
  name: SITE_NAME,
  short_name: SITE_NAME,
  description: SITE_DESCRIPTION,
  start_url: '/',
  display: 'standalone',
  background_color: BACKGROUND_COLOR,
  theme_color: BACKGROUND_COLOR,
  categories: ['games', 'music', 'entertainment'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: '/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export const Route = createFileRoute('/manifest.webmanifest')({
  server: {
    handlers: {
      GET: () =>
        Response.json(MANIFEST, {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=86400',
          },
        }),
    },
  },
})
