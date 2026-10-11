import { SITE_URL } from '#/lib/site'

// Product analytics through a self-hosted Umami. It's cookieless, and the
// script is only loaded by production builds on the real domain, so dev and
// e2e stay silent. Umami's automatic tracking is off: we send every
// pageview and event ourselves, with the URL already cleaned (no query
// string, no hash, room codes collapsed). Events never carry names, room
// codes or credentials.

const UMAMI = {
  src: 'https://umami.inselmann.online/script.js',
  websiteId: 'f3158837-d360-4446-b943-deb26937e0a6',
  hostname: new URL(SITE_URL).hostname,
}

// Every event and the question it answers. Values are low-cardinality on
// purpose, so Umami's breakdowns stay readable.
interface Events {
  // How many groups do we get, and how many people join each one?
  'room-create': undefined
  // Do people arrive through shared links or by typing the code?
  'room-join': { via: 'code' | 'invite' }
  // Do hosts use the invite link?
  'invite-copy': undefined
  // How do hosts find music (featured, search, pasted link) and which
  // playlists are popular? Pasted playlists are private picks: no title.
  'playlist-select': {
    source: 'featured' | 'search' | 'link'
    playlist?: string
  }
  // How big are groups, and how long do they want games to be?
  'game-start': { players: number; rounds: number }
  // Are games played to the end, and are songs too hard or too easy?
  'game-end': {
    players: number
    rounds: number
    played: number
    completed: boolean
    foundPercent: number
  }
  // Does a group play another game after the first?
  'game-restart': undefined
  // At which point do people leave a room?
  'room-leave': { phase: 'lobby' | 'round' | 'reveal' | 'ended' }
  // How often does the browser block the song until the player taps?
  'audio-blocked': undefined
}

type EventData = Record<string, string | number | boolean>

// The part of Umami's payload we set. The rest (website id, screen,
// language, hostname) comes from Umami's defaults.
interface Page {
  url: string
  title: string
  referrer: string
}

declare global {
  interface Window {
    umami?: {
      track: (
        payload: (defaults: Record<string, unknown>) => Record<string, unknown>,
      ) => void
    }
  }
}

const ROOM_PATH = /^\/r\/[^/]+/

// A path as analytics sees it: one entry for all rooms, not one per code.
export function analyticsPath(pathname: string): string {
  return pathname.replace(ROOM_PATH, '/r/:code')
}

// Titles come from the cleaned path, never from the document: a room's
// title holds its code, and on navigation the old title is still there.
const PAGE_TITLES: Record<string, string> = { '/': 'Home', '/r/:code': 'Room' }

// Where a visitor came from: another site as origin + path (its query
// string could hold search terms or tokens), or one of our own pages.
export function analyticsReferrer(referrer: string, origin: string): string {
  try {
    const url = new URL(referrer)
    return url.origin === origin
      ? analyticsPath(url.pathname)
      : url.origin + url.pathname
  } catch {
    return ''
  }
}

// The page being viewed, set by `trackPageview` and sent with every event.
let page: Page | null = null

// Calls made before the script has loaded. `null` once it has, or when
// analytics is off (dev, other hosts, blocked script).
let queue: Array<() => void> | null = null

function whenLoaded(call: () => void) {
  if (queue) queue.push(call)
  else if (window.umami) call()
}

// Injects the Umami script, once, on the production host only. Async and
// injected after hydration, so a slow analytics server never delays the
// game.
export function loadAnalytics() {
  if (
    !import.meta.env.PROD ||
    window.location.hostname !== UMAMI.hostname ||
    queue ||
    window.umami
  )
    return
  queue = []
  const script = document.createElement('script')
  script.async = true
  script.src = UMAMI.src
  script.dataset.websiteId = UMAMI.websiteId
  script.dataset.autoTrack = 'false'
  script.onload = () => {
    const pending = queue ?? []
    queue = null
    pending.forEach((call) => call())
  }
  script.onerror = () => {
    queue = null
  }
  document.head.append(script)
}

function send(event?: { name: string; data?: EventData }) {
  if (typeof window === 'undefined' || !page) return
  const current = page
  whenLoaded(() => {
    try {
      window.umami?.track((defaults) => ({ ...defaults, ...current, ...event }))
    } catch {
      // Analytics must never break the game.
    }
  })
}

// Call on every path change.
export function trackPageview(pathname: string) {
  const url = analyticsPath(pathname)
  page = {
    url,
    title: PAGE_TITLES[url] ?? url,
    referrer: page
      ? page.url
      : analyticsReferrer(document.referrer, window.location.origin),
  }
  send()
}

export function trackEvent<TName extends keyof Events>(
  name: TName,
  ...[data]: Events[TName] extends undefined ? [] : [Events[TName]]
): void {
  send({ name, ...(data && { data }) })
}
