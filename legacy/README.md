# ⚠️ Legacy: do not use

This is the original Sonq implementation (2021–2024). It **no longer works**
because Spotify removed `preview_url` from its Web API for most apps, and it
is **not** part of the workspace. It isn't installed, built, linted or
deployed.

It stays here only as a reference for the rewrite (see
[docs/plan.md](../docs/plan.md)):

- `api/`: shared socket.io event types and domain types (`@sonq/api`)
- `server/`: express + socket.io + MobX game server with Spotify OAuth and a Redis cache
- `client/`: Next.js 14 pages-router frontend (de/en locales, phase components)
- `ci/`: the old GitHub Actions Docker workflows, Heroku buildpack config and VS Code launch config
- `docker-compose.yml`: Redis for the old playlist cache

Don't import from here, and don't fix things here. Port ideas to `apps/` or
`packages/` instead. Once the rewrite reaches feature parity this folder can
be deleted, because git history keeps it.
