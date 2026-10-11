# Sonq

Multiplayer song guessing game. Everyone in a room hears the same 30 s Deezer
preview and races to find the song via search. Faster correct guesses score
more. All UI text, code, comments and docs are in English.

The roadmap and the design rationale are in [docs/plan.md](docs/plan.md).
Its "After the MVP" list is the backlog.

## Stack

- **Monorepo**: Turbo + Bun workspaces. `apps/*` are deployables and `packages/*` are internal libraries. Bun handles everything (install, scripts, tests, production runtime); don't use npm, pnpm or yarn.
- **Framework**: TanStack Start (React 19) with TanStack Router file-based routing in [apps/web/src/routes/](apps/web/src/routes/). `routeTree.gen.ts` is generated (`bun run generate-routes`, also part of `typecheck`), so never edit it by hand.
- **Build**: Vite 8 with the `nitro` plugin (`bun` preset). Tailwind CSS v4 with its config in `@theme` in [styles.css](apps/web/src/styles.css) (no `tailwind.config`).
- **Data fetching**: server functions (`createServerFn`, validated with `.validator(zodSchema)`) plus TanStack Query for searches and mutations.
- **Validation**: Zod v4 on every server function input, every SSE event the client receives, every Deezer response, and everything read from localStorage.
- **Music data**: the Deezer public API (no auth, no CORS, ~50 req / 5 s per IP). Only the server talks to Deezer, through caches.
- **Realtime**: Server-Sent Events for server → client and server functions for client → server. No WebSockets.
- **Deployment**: the root [Dockerfile](Dockerfile) (`turbo prune` + `oven/bun`). Single instance only, because state lives in memory.

## Commands

Run from the repo root. Turbo fans them out to the workspaces.

- `bun install`: install dependencies
- `bun run dev`: dev server on port 3000
- `bun run build` / `bun run start`: production build into `apps/web/.output/` / run it
- `bun run typecheck` / `bun run test` / `bun run lint`
- `bun run format` / `bun run check`: Prettier write / check
- `cd apps/web && bun run test:e2e`: Playwright, in a `desktop` and a `mobile` (Pixel 7) project. It starts its own dev server on port **3100** with `DEEZER_FAKE=1` and `SONQ_FAST_TIMERS=1`. Locally it reuses a server already running on 3100, so start that one with the same env vars
- Single workspace: `bunx turbo run test --filter=@sonq/game`, or `bun test` inside the package (`bun test src/reducer.test.ts` for one file)

CI ([.github/workflows/test.yml](.github/workflows/test.yml)) runs typecheck, lint, unit tests and e2e.

## Layout

```
apps/web/          TanStack Start app: routes, components, room store, server functions
packages/game/     pure game logic: domain types, wire schemas, reducer, view, scoring, matching
packages/deezer/   typed Deezer client: fetch + Zod schemas + typed errors (no caching)
packages/tsconfig/ shared tsconfig bases (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
legacy/            old Next.js + express + socket.io + Spotify version. Reference only
docs/              plan.md, screenshots
```

- `legacy/` is **not** a workspace. Don't import from it, build it or fix it.
- Internal packages are just-in-time: `exports` points at `src/index.ts`, there is no build step, and Vite bundles them. Name them `@sonq/<dir>`.
- `@sonq/game` depends on `zod` only. `@sonq/deezer` depends on `zod` only and takes `fetch` as an option.

## Game architecture

Each layer only knows the one below it:

1. **[packages/game/src/types.ts](packages/game/src/types.ts)**: the server-side domain. `Room` (with player secrets and the playing track), the `Phase` union, `Action`, `Deps`, and the timing constants.
2. **[packages/game/src/protocol.ts](packages/game/src/protocol.ts)**: everything on the wire, as Zod schemas: `commandSchema`, `roomViewSchema`, `roomEventSchema`, `GAME_ERRORS`.
3. **[packages/game/src/reducer.ts](packages/game/src/reducer.ts)**: pure `reduce(room, action, deps) → { ok, room } | { ok: false, error }`. Phases: `lobby → round → reveal → … → ended → lobby`. [selectors.ts](packages/game/src/selectors.ts) holds derived values (`deadlineOf`, `totalRounds`, `revealedRounds`).
4. **[packages/game/src/view.ts](packages/game/src/view.ts)**: `project(room, viewerId)` returns what one player may see. The track is **never** projected during `round`.
5. **[apps/web/src/server/rooms.server.ts](apps/web/src/server/rooms.server.ts)**: `createRoomStore({ clock, random })`, an in-memory store (singleton on `globalThis`). It runs dispatch → reduce → `version++` → pushes projected snapshots to SSE subscribers, and owns every timer.
6. **[apps/web/src/server/rooms.ts](apps/web/src/server/rooms.ts)** and **[music.ts](apps/web/src/server/music.ts)**: server functions. All in-room commands go through one `roomCommandFn` (one auth path). Playlist loading (`selectPlaylistFn`) is async, so it happens before dispatch.
7. **Routes**: `api/rooms/$code/events` (SSE) and `api/rooms/$code/audio` (302 to a freshly signed preview). Both take credentials in the query string.
8. **Client**: [useRoom](apps/web/src/lib/useRoom.ts) opens an `EventSource`, validates events, and drops snapshots older than `version`. State only ever arrives via SSE. Phase components read the room through `useRoomContext()`.

Invariants. Don't break these:

- **The reducer is pure.** No `Date.now()`, no `Math.random()`, no I/O, no throws. Time and randomness come from `deps`. Async work happens in a server function first, then a fully resolved action is dispatched (e.g. `setPlaylist`).
- **Time is data.** Self-ending phases store their deadline. The store keeps exactly one timer per room for `deadlineOf(phase)` and dispatches `{ type: 'deadline' }`. The reducer re-checks `now`, so a stale or early timer is a no-op. Don't add `setTimeout`s that change state.
- **Durations are injected, not imported.** Countdown, round and reveal lengths come in as `deps.timings` (`DEFAULT_TIMINGS` in production). The store's `StoreTimings` adds disconnect grace and host timeout, and `SONQ_FAST_TIMERS=1` switches to `FAST_STORE_TIMINGS` for e2e. Code that needs a round's length derives it from the round (`endsAt - startsAt`). Only `GUESS_COOLDOWN_MS` is a constant, because it's a rule rather than pacing.
- **Derive, don't store.** Scores, round numbers (`history.length`), totals and recap stats are computed from state. A room whose last player left (`players` is empty) is closed by the store; there is no separate effects channel.
- **Make bad states unrepresentable.** For example, `Playlist.tracks` is a `NonEmptyArray`, so an empty playlist is rejected before it can reach the reducer.
- **Preview URLs are never stored.** They expire after about 15 minutes; the audio route resolves a fresh one per request.

To add a room feature: extend `commandSchema` → handle it in the reducer with a `reducer.test.ts` case → expose the new state through `phaseViewSchema`/`roomViewSchema` + `project` (the view tests parse every projection with the schema) → render it → add any new `GameError` to `ERROR_TEXT` in [ui.tsx](apps/web/src/components/ui.tsx), which TypeScript enforces.

## Logging

- Use `createLogger(scope)` from [log.server.ts](apps/web/src/server/log.server.ts). It writes one logfmt line per event: `12:03:41.207 DEBUG rooms   dispatch code=ABCD action=command:guess phase=round#1 version=5`.
- `LOG_LEVEL` sets the level (`debug | info | warn | error | silent`). The default is `debug` in dev, `info` in production and `silent` under `bun test`. It is read at runtime, so changing it needs a restart, not a rebuild.
- Scopes:
  - `rooms`: every dispatch (action, result or error, phase transition, version), guesses next to their answer, deadline timers, streams, and auth failures. Room lifecycle, game start/end and host changes are logged at info.
  - `deezer`: every real Deezer request (cache misses only) with its duration, plus failures with their `DeezerError` kind.
  - `fn`: every server function call, from the global middleware in [start.ts](apps/web/src/start.ts).
  - `audio`: preview redirects.
- Fields only accept primitives, so a `Room` can't be dumped by accident. **Never log player secrets**; [rooms.server.test.ts](apps/web/src/server/rooms.server.test.ts) asserts this. Log ids, not names.
- Anything that logs takes a `Logger` as an optional dependency (`createRoomStore({ log })`, `createMusic(client, log)`), so tests can capture output with `createLogger(scope, { level: 'debug', write })`.

## Conventions

- TypeScript strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Use the `Array<T>` style and `TName` type parameters (`@tanstack/eslint-config`). No `any`, and no `as` casts outside tests.
- Prettier: no semicolons, single quotes, trailing commas.
- Path alias `#/*` → `apps/web/src/*`.
- Server-only modules use the `*.server.ts` suffix. Client code may only `import type` from them.
- Fallible operations return `Result<T>` (`{ ok: true, … } | { ok: false, error: GameError }`). `@sonq/deezer` throws `DeezerError`, and the music service turns those into `Result`s. Anything else that throws is a bug.
- Injectable seams for tests: `Clock`, `random` and `timings` for the store, `DeezerClient` for music, `fetch` for the Deezer client, `now` for caches.
- [vite.config.ts](apps/web/vite.config.ts) has a dev-only plugin that removes `Sec-Fetch-Dest` from `/api/*` requests. Without it, Nitro's dev server sends `<audio src="/api/…">` requests to Vite's static files and they 404. Keep it registered before `nitro()`.
- localStorage goes through [storage.ts](apps/web/src/lib/storage.ts) (prefix `sonq:`, try/catch, Zod-validated reads).
- Commits use Conventional Commits, lowercase, no scope (`feat:`, `fix:`, `chore:`, `test:`, `ci:`). Use the `/commit` skill.

## Tests

- Unit tests sit next to the code as `*.test.ts` and run with `bun test`. Each app's `bunfig.toml` excludes `e2e/`.
- Cover game rules in [reducer.test.ts](packages/game/src/reducer.test.ts) with the builders in [testing.ts](packages/game/src/testing.ts). New game behaviour without a reducer test is incomplete.
- The store is tested with a fake `Clock` in [rooms.server.test.ts](apps/web/src/server/rooms.server.test.ts), so whole games run without real timers.
- Deezer tests use the recorded JSON in [packages/deezer/src/fixtures/](packages/deezer/src/fixtures/) and never hit the network.
- E2E ([apps/web/e2e/](apps/web/e2e/)) runs against the offline catalog in [fake-deezer.server.ts](apps/web/src/server/fake-deezer.server.ts). Every track in it is a version of "Test Song", so any of them is a correct guess, and "Decoy Song" is always wrong. "E2E Hits" has 5 songs; "E2E Duo" has 2, for tests that play a whole game. Import `test`/`expect` from [e2e/fixtures.ts](apps/web/e2e/fixtures.ts), open players with `newPlayer()`, and drive pages through the `Player` helper. Locate elements by role, then label/text, then `data-testid`; never by CSS class.
