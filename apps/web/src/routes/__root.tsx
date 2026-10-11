import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Panel, Shell } from '#/components/ui'
import {
  BACKGROUND_COLOR,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from '#/lib/site'
import appCss from '../styles.css?url'
// Self-hosted (no third-party font CDN). The Latin subset is preloaded so the
// first paint doesn't wait for styles.css to discover it.
import outfitLatin from '@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      { name: 'theme-color', content: BACKGROUND_COLOR },
      { name: 'application-name', content: SITE_NAME },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:image', content: OG_IMAGE.url },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: String(OG_IMAGE.width) },
      { property: 'og:image:height', content: String(OG_IMAGE.height) },
      { property: 'og:image:alt', content: OG_IMAGE.alt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE.url },
      { name: 'twitter:image:alt', content: OG_IMAGE.alt },
    ],
    links: [
      {
        rel: 'preload',
        href: outfitLatin,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  // Marks the page as interactive once React has hydrated it, for e2e tests.
  useEffect(() => {
    document.documentElement.dataset.hydrated = ''
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-neutral-950 font-sans">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <Shell>
      <Panel className="mx-auto w-full max-w-md text-center">
        <h1 className="font-display text-2xl font-black">Page not found</h1>
        <p className="mt-2 text-neutral-400">
          This page doesn't exist. Start a new game instead?
        </p>
        <a
          href="/"
          className="mt-4 inline-block rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
        >
          Play sonq
        </a>
      </Panel>
    </Shell>
  )
}
