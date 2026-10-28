import { loadEnv } from 'vite'

// Match the Playwright-managed Vite dev server, including quoted values and
// .env.local overrides. The caller's process environment has final precedence.
export function readCommerceEnvironment() {
  return { ...loadEnv('development', process.cwd(), ''), ...process.env }
}
