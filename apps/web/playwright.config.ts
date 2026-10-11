import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Phones are the main way people play.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `bunx vite dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/health`,
    env: { DEEZER_FAKE: '1', SONQ_FAST_TIMERS: '1' },
    reuseExistingServer: !process.env.CI,
  },
})
