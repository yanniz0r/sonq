// What search engines and link previews see: the public origin, names and
// copy that the route heads, robots.txt and the sitemap share.
export const SITE_URL = 'https://sonq.de'
export const SITE_NAME = 'sonq'

export const SITE_TITLE = 'sonq – Multiplayer Song Guessing Game with Friends'
export const SITE_DESCRIPTION =
  'Free online music quiz for up to 16 players. Everyone hears the same 30-second preview from any Deezer playlist, and the fastest to find the song wins. No sign-up, no download.'

// The page background (neutral-950), for the manifest and browser UI.
export const BACKGROUND_COLOR = '#0a0a0a'

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href

// The share image that link previews and search results show.
export const OG_IMAGE = {
  url: absoluteUrl('/og.png'),
  width: 1200,
  height: 630,
  alt: 'sonq – guess the song, faster than your friends',
}

// Pages that should be indexed, for the sitemap.
export const INDEXED_PATHS = ['/']

// A page's title and description, repeated for link previews. Child routes'
// meta replace the root's by name/property.
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: absoluteUrl(path) },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
}
