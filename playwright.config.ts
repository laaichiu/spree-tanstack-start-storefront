import { defineConfig, devices } from '@playwright/test'

const requestedPort = Number(process.env.PLAYWRIGHT_PORT)
const port =
  Number.isInteger(requestedPort) &&
  requestedPort >= 1 &&
  requestedPort <= 65535
    ? requestedPort
    : 3102
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const usesExistingServer = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(usesExistingServer
    ? {}
    : {
        webServer: {
          command: `PLAYWRIGHT=true WRANGLER_WRITE_LOGS=false ./node_modules/.bin/vite dev --port ${port} --host 127.0.0.1`,
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
          stderr: 'pipe',
          stdout: 'pipe',
          timeout: 120_000,
          url: `${baseURL}/us/en`,
        },
      }),
})
