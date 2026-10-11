import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

// Nitro's dev server hands requests whose Sec-Fetch-Dest names an asset
// (audio, image, …) to Vite's static file serving unless the path is a
// Nitro-native route, so `<audio src="/api/rooms/…/audio">` got a 404 in
// dev. Dropping the header for /api/* lets those requests reach the app.
// Production doesn't run that middleware. Must be registered before nitro.
function apiRoutesInDev(): Plugin {
  return {
    name: 'sonq:api-routes-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api/')) delete req.headers['sec-fetch-dest']
        next()
      })
    },
  }
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    apiRoutesInDev(),
    nitro({ preset: 'bun' }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})
