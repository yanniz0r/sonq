import { createFileRoute } from '@tanstack/react-router'

import { absoluteUrl } from '#/lib/site'

// Rooms (/r/…) aren't disallowed: crawlers have to load them to see their
// noindex, otherwise shared invite links could still show up as bare URLs.
const ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /health

Sitemap: ${absoluteUrl('/sitemap.xml')}
`

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(ROBOTS, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }),
    },
  },
})
