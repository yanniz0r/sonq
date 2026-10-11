import { createFileRoute } from '@tanstack/react-router'

import { INDEXED_PATHS, absoluteUrl } from '#/lib/site'

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${INDEXED_PATHS.map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`).join('\n')}
</urlset>
`

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(SITEMAP, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }),
    },
  },
})
