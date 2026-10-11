# Sonq rewrite plan

Sonq is a multiplayer song guessing game. Everyone in a room hears the same
30-second preview at the same time and races to find the song in a search
box. Faster correct guesses earn more points.

The old version (now in [legacy/](../legacy/)) stopped working because
Spotify removed `preview_url` for most tracks. This rewrite keeps the concept
and replaces everything underneath it.

## Goals

- Playable again, with **Deezer previews**. Deezer's API is public, so there is no login and no OAuth app.
- **One TanStack Start app** in a Turbo monorepo, with no separate client and server deploys.
- **SSE + server functions** instead of socket.io. State only ever reaches clients through SSE, and every client→server write is a server function.
- **A pure, exhaustively tested game state machine.** It follows the layering of [NHIE](https://github.com/yanniz0r/NHIE): `types → reducer → view → store → routes → client`.
- One server instance with in-memory state. Rooms die on redeploy, which is acceptable.

## Non-goals (for the MVP)

Accounts, persistence, horizontal scaling, i18n, and native apps.

---

## What we keep, what we drop

| Legacy                                                                                   | Decision                                                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Phases lobby → play-song → review → summary                                              | **Keep** as `lobby → round → reveal → … → ended`                                                      |
| Guess by searching and picking a track                                                   | **Keep**. It is the core of the game                                                                  |
| Time-based scoring, pre-round countdown, playback-failure "tap to play" fallback, volume | **Keep**                                                                                              |
| Summary stats (fastest answer, closest call, most wrong guesses)                         | **Later**, derived from history                                                                       |
| Popularity bonus                                                                         | **Later**, using Deezer `rank`                                                                        |
| Spotify OAuth + SDK, `spotify-redirect` page                                             | **Drop**. Deezer needs no auth                                                                        |
| socket.io, express, `@sonq/api` event-type package                                       | **Drop**. Replaced by SSE, server functions and Zod schemas in `packages/game`                        |
| MobX `reaction()`s driving transitions and timeouts                                      | **Drop**. This was the main source of bugs. Replaced by a pure reducer plus deadlines stored in state |
| Mutable counters (`score`, `wrongAnswerCounter`, `closestCall`, …)                       | **Drop**. Everything is derived from `history`                                                        |
| Redis playlist cache, docker-compose                                                     | **Drop**. Replaced by an in-memory TTL cache                                                          |
| Next.js pages router, react-query v3, formik/yup, lodash, dayjs, tslog, i18next          | **Drop**                                                                                              |
| Lerna, Yarn 1, Heroku buildpack, two Docker images                                       | **Drop**. Replaced by Turbo, Bun and one Docker image                                                 |
| Admin key in URL                                                                         | **Drop**. Replaced by per-player id + secret, with the host as a role (NHIE model)                    |

---

## Deezer facts (verified 2026-10-11)

- **No auth.** `api.deezer.com` works anonymously for `/search`, `/search/playlist`, `/playlist/{id}`, `/playlist/{id}/tracks`, `/track/{id}` and `/chart/0/playlists`.
- **No CORS header** (`Access-Control-Allow-Origin` is absent), so every call goes through our server.
- **Rate limit: 50 requests per 5 s per IP.** All players share the server's IP, so search results must be cached and debounced. Deezer reports errors as HTTP 200 with an `{ error: { code, … } }` body (code 4 means quota exceeded). The client has to check for that body.
- **Preview URLs expire.** They are signed (`hdnea=exp=…`) and live about 13 minutes. Never store them in room state. Resolve them fresh per round.
- Tracks have `title`, `title_short` (no version suffix), `title_version`, `artist { id, name }`, `album { cover_* }`, `rank`, `readable` and `preview`. Filter the pool to `readable && preview`.

---

## Repository layout

```
apps/
  web/                 TanStack Start app (routes, components, server store, SSE)
packages/
  game/                pure game logic: types + Zod schemas, reducer, view, scoring, matching
  deezer/              typed Deezer client: fetch + Zod schemas + typed errors (server-only)
  tsconfig/            shared tsconfig bases
legacy/                old Next.js / express / socket.io implementation (reference only)
docs/                  this plan, screenshots
```

Internal packages are **just-in-time**: they export TypeScript source, have no
build step, and Vite bundles them. `packages/game` depends on Zod only, so it
cannot import React, TanStack or Deezer even by accident.

**Toolchain:** Bun (install, scripts, tests, production runtime), Turbo, Vite
with the `nitro` plugin (`bun` preset), React 19, TanStack Router/Start,
TanStack Query (mutations), Tailwind v4, Zod v4, Playwright, and
`@tanstack/eslint-config` + Prettier (no semicolons, single quotes, trailing
commas). The setup mirrors NHIE so both projects stay familiar.

---

## The game state machine

This is the most important part of the design. It has three rules:

1. **The reducer is pure.** `reduce(room, action, deps) → { ok, room, effects } | { ok: false, error }`. Time (`deps.now`) and randomness (`deps.pick`) are injected. The reducer has no timers, no I/O and no throws.
2. **Time is data.** Phases that end by themselves carry their deadline (`endsAt`). The store sets a single timer for `deadlineOf(room.phase)` and dispatches `{ type: 'deadline' }` when it fires. The reducer checks `now >= deadline` itself, so a stale or duplicate timer does nothing. Nothing in the system is "scheduled" except that one wake-up call.
3. **Nothing is counted, everything is derived.** Scores, rankings and recap stats are computed from `history` (finished rounds) plus the current round. No counters can drift out of sync.

### Phases

```
lobby ──start──▶ round(i) ──deadline | all correct──▶ reveal(i) ──deadline | next──▶ round(i+1)
  ▲                 │                                    │
  │                 │ end                                │ end, or deadline | next after the last round
  │                 ▼                                    ▼
  └──restart──── ended ◀─────────────────────────────────┘
```

```ts
type Phase =
  | { kind: 'lobby' }
  | { kind: 'round'; index: number; round: Round } // deadline: round.endsAt
  | { kind: 'reveal'; index: number; round: Round; endsAt: number }
  | { kind: 'ended' }

interface Round {
  track: Track // domain track, never a preview URL
  startsAt: number // after the countdown; audio starts here
  endsAt: number // startsAt + ROUND_MS
  guesses: Partial<Record<PlayerId, Array<Guess>>>
}
interface Guess {
  at: number
  title: string
  artist: string
  correct: boolean
}

interface Room {
  code: string
  hostId: PlayerId
  players: Array<Player> // id, name, secret, hue, connected, joinedAt
  settings: { rounds: number } // 5 | 10 | 15, default 10
  playlist: PlaylistSummary | null // id, title, cover, trackCount
  pool: Array<Track> // playable tracks of the playlist
  played: Array<TrackId> // dealt this room; reset when the pool runs out
  phase: Phase
  history: Array<Round> // revealed rounds of the current game
  version: number
  lastActivity: number
}
```

The countdown is not a separate phase. A `round` with `now < startsAt` is the
countdown, and the client gets that time to preload the audio.

### Actions

| Action                                 | Source                                    | Notes                                      |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| `command` `{ by, command }`            | player, via `roomCommandFn`               | `command` is the Zod `commandSchema` below |
| `setPlaylist` `{ by, playlist, pool }` | store, after it loaded the playlist async | not client-constructible                   |
| `join` `{ player }`                    | store                                     |                                            |
| `presence` `{ playerId, connected }`   | store (SSE open/close + grace timer)      |                                            |
| `hostTimeout`                          | store                                     |                                            |
| `deadline`                             | store timer                               | no payload; the reducer checks `now`       |

Commands: `updateSettings { rounds }`, `start`, `guess { trackId, title, artist }`,
`next`, `end`, `restart` and `leave`. `selectPlaylist { playlistId }` is a
separate server function because it does async work before it dispatches
`setPlaylist`.

### Rules

| Trigger                              | Allowed when                     | Result                                                                                               | Errors                                                    |
| ------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `setPlaylist`                        | host, lobby                      | set `playlist`, `pool`, reset `played`                                                               | `not_host`, `wrong_phase`, `playlist_empty`               |
| `updateSettings`                     | host, lobby                      | merge settings                                                                                       | `not_host`, `wrong_phase`                                 |
| `start`                              | host, lobby, playlist set        | clear history, deal round 0                                                                          | `not_host`, `wrong_phase`, `no_playlist`                  |
| `guess`                              | round, `startsAt ≤ now < endsAt` | append the guess; correct if it matches (see below)                                                  | `wrong_phase`, `too_early`, `already_correct`, `cooldown` |
| `deadline` in round                  | `now ≥ endsAt`                   | → `reveal`, `endsAt = now + REVEAL_MS`                                                               | (no-op otherwise)                                         |
| `deadline` in reveal                 | `now ≥ endsAt`                   | archive the round; deal the next round, or → `ended` after the last one                              | (no-op otherwise)                                         |
| `next`                               | host, reveal                     | same as the reveal deadline (skip the wait)                                                          | `not_host`, `wrong_phase`                                 |
| `end`                                | host, round or reveal            | → `ended`; an unrevealed round is dropped                                                            | `not_host`, `wrong_phase`                                 |
| `restart`                            | host, ended                      | → `lobby`, clear history (keep `played` so songs don't repeat)                                       | `not_host`, `wrong_phase`                                 |
| `join`                               | not ended, room not full         | add player (mid-game joiners start at 0)                                                             | `wrong_phase`, `room_full`                                |
| `leave` / `hostTimeout` / `presence` | always                           | the NHIE behaviour: host handoff to the longest-present connected player; `closed` effect when empty | –                                                         |
| after `guess` / `presence` / `leave` | round                            | **auto-reveal** once every connected player has a correct guess (and at least one exists)            | –                                                         |

There is no minimum player count, so solo play works and doubles as a smoke test.

### Guess matching (`packages/game/src/match.ts`)

The client sends the `title` and `artist` of the search result it picked. It
doesn't need to be trusted: a player who could type the right title could also
find it in the search. Matching is therefore pure and synchronous, with no
Deezer lookup:

- A guess is correct if `trackId` equals the answer's id, **or** `normalize(title)` equals `normalize(answer.titleShort)` and `normalize(artist)` equals `normalize(answer.artist)`.
- `normalize` lowercases, strips diacritics, removes `(…)`/`[…]` and ` - Remastered…`/` - Live…` suffixes and `feat.` parts, and collapses non-alphanumerics.
- As a result, the live, remastered and single versions of a song all count. This needs a table-driven test file of real Deezer titles.

### Scoring (`packages/game/src/scoring.ts`)

`points = round(100 + 900 × (1 − elapsed / ROUND_MS))` for the first correct
guess, where `elapsed = guess.at − round.startsAt`. Wrong guesses cost nothing
except a `GUESS_COOLDOWN_MS` (2 s) lockout, which the reducer enforces from
`at` timestamps. Constants: `COUNTDOWN_MS = 3000`, `ROUND_MS = 30000`,
`REVEAL_MS = 8000`.

### Projection (`packages/game/src/view.ts`)

`project(room, viewerId) → RoomView` (a Zod schema that is validated on the client):

- **round**: `index`, `total`, `startsAt`, `endsAt`, `correctIds` (who already got it), `myGuesses`. **No track.** The audio is fetched through an opaque URL (see below).
- **reveal**: the track (title, artist, cover), per-player `{ points, elapsedMs }` for this round, and the number of wrong guesses.
- **ended**: a recap with the ranking and the song list (how many players found each song).
- Always included: players, host, playlist summary, settings, and a `scores` map derived from history.

SSE events are `state { view, serverNow }`, `kicked` and `closed`. The client
uses `serverNow` to estimate its clock offset for the countdown and for audio sync.

---

## Server layer (`apps/web/src/server/`)

- **`rooms.server.ts`** is a port of the NHIE store: an in-memory `Map` on `globalThis`, `dispatch → reduce → version++ → project per subscriber`, disconnect grace (10 s), host handoff (60 s), idle GC (2 h) and room cap. The one addition is **`armDeadline(room)`**: after every dispatch it clears the room's timer and calls `setTimeout(dispatch deadline, deadlineOf(phase) − now)`.
- **`rooms.ts`** holds the server functions `createRoomFn`, `joinRoomFn`, `roomCommandFn` (one auth path for all commands) and `selectPlaylistFn`. `selectPlaylistFn` authenticates, loads the playlist through `@sonq/deezer` (cached), maps it to game `Track`s, and dispatches `setPlaylist`.
- **`deezer.ts`** holds `searchTracksFn`, `searchPlaylistsFn` and `featuredPlaylistsFn`. They require room credentials, so the Deezer proxy isn't open to the internet. Searches are cached in a TTL/LRU cache for 10 min, chart results for 1 h, and playlists for 1 h with a 500-track cap.
- **`routes/api/rooms/$code/events.ts`** is the SSE stream, same as NHIE (credentials in the query string, 15 s heartbeat).
- **`routes/api/rooms/$code/audio.ts`** handles `?round=N&playerId&secret`. If round `N` is current (round or reveal phase), it fetches a fresh preview URL via `GET /track/{id}` (cached 5 min) and responds with **302**. The client never learns the track id or title, and the URL never expires mid-game.
- **`routes/health.ts`** returns `GET /health → OK`.

## Client (`apps/web/src/`)

- Routes: `/` (create or join a room) and `/r/$code` (the room, `ssr: false`, with credentials in localStorage as `sonq:room:<code>`, which also gives "resume after reload" for free).
- `useRoom(code, session)` works like NHIE: it validates every event and ignores snapshots that are older than the current `version`.
- There is one component per phase: `Lobby` (players, playlist picker with featured, search and paste-a-link options, rounds, start), `Round` (countdown, progress bar, debounced search with results as tappable cards, my guesses, ✓ markers on players), `Reveal` (cover, title, artist, round points, scoreboard) and `Recap` (podium, song list, play again / back to lobby).
- **Audio:** a single persistent `<audio>` element at room level, unlocked by the first tap (a "tap to enable sound" overlay if needed). The `src` is set at the start of the countdown, playback starts at `startsAt + clockOffset`, and late joiners seek to `elapsed`. If `play()` throws `NotAllowedError`, a big play button appears (as in legacy). Volume is kept in localStorage.

---

## MVP milestones

All of them are done. Typecheck, lint, 114 unit tests and 3 Playwright tests
are green, and the Docker image builds and serves. M5's acceptance test
(two phones and a laptop playing a full game against a real playlist) still
needs a manual run.

- **M0: Restructure** ✅. Legacy code moved to `legacy/`; Lerna, Yarn, Heroku and old CI removed; Bun + Turbo workspaces set up.
- **M1: Scaffold** ✅. `packages/tsconfig`, `apps/web` (TanStack Start, Vite 8, Nitro bun preset, Tailwind v4), ESLint + Prettier, and the turbo tasks.
- **M2: Game core** ✅. `packages/game` with 73 tests that cover every row of the rules table; the view tests parse every projection with the wire schema.
- **M3: Deezer** ✅. `packages/deezer` with 19 tests against recorded fixtures.
- **M4: Server wiring** ✅. Store, server functions, and the SSE and audio routes. The store is tested with a fake `Clock`.
- **M5: UI** ✅. Home, Lobby (playlist picker with featured, search and pasted links), Round, Reveal, Recap and synced audio.
- **M6: Ship** ✅. Dockerfile (`turbo prune`), GitHub Actions workflow, and Playwright e2e against the offline catalog (`DEEZER_FAKE=1`). Coolify deployment is still to do.

### Where the implementation deviates from this plan

The sections above describe the original design. These changes were made
while building it, and the code and CLAUDE.md are authoritative:

- **No `effects` channel.** The only effect was "room closed", and that is derivable: the store drops a room whose `players` is empty. Kicks will need to bring an event back (a `kicked` SSE event), but as a store concern, not a reducer one.
- **No stored round index.** Phases carry no `index`; it is always `history.length`. `reveal` keeps its `round` until the next deal, and `revealedRounds(room)` gives the rounds that count for scores.
- **`Playlist.tracks` is a `NonEmptyArray`.** An empty playlist can't be represented, so `playlist_empty` is raised by the music service before dispatch, not by the reducer.
- **`deps.random` instead of `deps.pick`.** Track selection (no repeats until the playlist runs out) lives in the reducer and is tested there.
- **Wire schemas live in `protocol.ts`,** separate from the server-only domain types in `types.ts`.
- **The TTL cache lives in the app** (`apps/web/src/server/ttl-cache.ts`), not in `packages/deezer`. The client stays a thin, stateless wrapper.
- **The `Clock` is `schedule(run, ms) → cancel`,** so the store never handles timer IDs and tests need no fake-timer library.
- **Idle rooms are swept when a room is created** instead of on an interval, because creating a room is the only way the store grows.

---

## After the MVP (rough priority)

1. **Share and manage:** room QR code, copy invite link, kick player (all ported from NHIE).
2. **More scoring:** first-correct bonus, streaks, popularity bonus from `rank`, and partial points for artist-only matches.
3. **Recap stats** from the legacy game (fastest answer, closest call, most wrong guesses), derived from history.
4. **Live guess bubbles:** show other players' wrong guesses during the round (legacy `guess-bubbles`).
5. **TV / host-screen mode:** a big screen plays the audio and shows the scoreboard while phones only guess.
6. **Settings:** round length (15/30 s), reveal length, and a multiple-choice mode for casual groups.
7. **Curated playlist packs** (decades, genres) on the home page, plus "random featured playlist".
8. **Anti-cheat:** stream-proxy the preview instead of using a 302, so the CDN URL isn't exposed, and add per-player search rate limiting.
9. **i18n** (de/en, as legacy had) and umami analytics.
10. **Multi-instance** (Redis pub/sub + store), only if traffic ever needs it.

## Open questions (current defaults)

- **UI language:** English for the MVP, i18n later.
- **Matching strictness:** title and artist must both match, any version counts.
- **Solo play:** allowed.
