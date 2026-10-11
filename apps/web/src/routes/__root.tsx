import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'sonq – guess the song with friends' },
      {
        name: 'description',
        content:
          'A multiplayer song guessing game: everyone hears the same preview, the fastest to find the song wins.',
      },
      { name: 'theme-color', content: '#0a0a0a' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
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
