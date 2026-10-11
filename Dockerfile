# Builds and runs @sonq/web. `turbo prune` cuts the monorepo down to the app
# and the workspace packages it depends on, so unrelated changes don't bust
# the install layer.
FROM oven/bun:1.4 AS base
WORKDIR /app

FROM base AS prune
COPY . .
RUN bunx turbo@^2.6.0 prune @sonq/web --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN bunx turbo run build --filter=@sonq/web

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.output ./.output
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
