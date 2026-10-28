import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const configuredSpreeDemoPath = process.env.E2E_SPREE_DEMO_PATH?.trim()
const spreeDemoPath =
  configuredSpreeDemoPath && path.isAbsolute(configuredSpreeDemoPath)
    ? configuredSpreeDemoPath
    : undefined

export const HAS_SPREE_DEMO_PATH = Boolean(
  spreeDemoPath && existsSync(path.join(spreeDemoPath, 'Gemfile')),
)

export const HAS_ORDER_GROUP_FIXTURE =
  HAS_SPREE_DEMO_PATH ||
  process.env.E2E_ORDER_GROUP_FIXTURE_READY?.trim() === 'true'

export function runSpreeDemoScript(
  script: string,
  environment: NodeJS.ProcessEnv = {},
) {
  if (configuredSpreeDemoPath && !spreeDemoPath) {
    throw new Error('E2E_SPREE_DEMO_PATH must be an absolute path.')
  }

  if (!spreeDemoPath || !HAS_SPREE_DEMO_PATH) {
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
