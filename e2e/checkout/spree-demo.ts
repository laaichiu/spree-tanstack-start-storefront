import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const spreeDemoPath =
  process.env.E2E_SPREE_DEMO_PATH?.trim() ||
  path.resolve(process.cwd(), '../spree-demo')

export const HAS_SPREE_DEMO_PATH = existsSync(
  path.join(spreeDemoPath, 'Gemfile'),
)

export function runSpreeDemoScript(
  script: string,
  environment: NodeJS.ProcessEnv = {},
) {
  if (!HAS_SPREE_DEMO_PATH) {
    throw new Error(
      'Set E2E_SPREE_DEMO_PATH to a local spree-demo app before seeding checkout test data.',
    )
  }

  return execFileSync('bundle', ['exec', 'rails', 'runner', script], {
    cwd: spreeDemoPath,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...environment,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}
