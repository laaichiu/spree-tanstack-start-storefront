import { load } from 'js-yaml'

const install = 'pnpm install --frozen-lockfile'
const tuple = 'pnpm verify:spree-runtime --require-revision'
const browsers = 'pnpm exec playwright install --with-deps chromium'
const audit = 'pnpm audit --prod --audit-level=high'
const specifications = {
  'ci.yml': { job: 'validate', commands: [install, audit, 'pnpm validate'] },
  'deploy-storefront.yml': {
    job: 'deploy',
    environment: 'production',
    commands: [
      install,
      audit,
      'pnpm validate',
      tuple,
      'pnpm run deploy',
      browsers,
      'pnpm test:e2e:read-only',
    ],
  },
  'staging-storefront-smoke.yml': {
    job: 'smoke',
    environment: 'staging',
    commands: [install, tuple, browsers, 'pnpm test:e2e:read-only'],
  },
  'staging-storefront-commerce.yml': {
    job: 'commerce',
    environment: 'staging-commerce',
    commands: [
      install,
      tuple,
      'pnpm verify:spree-commerce-runtime',
      browsers,
      'pnpm test:e2e:checkout:release',
    ],
  },
}

// Validate our deliberately small workflow contract, rather than treating
// comments, disabled steps, or arbitrary YAML text as executed release gates.
export function checkWorkflows({ read, fail, sourceTarget }) {
  for (const [name, spec] of Object.entries(specifications)) {
    const path = `.github/workflows/${name}`
    const content = read(path)
    if (!content) continue
    let workflow
    try {
      workflow = load(content)
    } catch {
      fail(`${path} must be valid YAML`)
      continue
    }
    const reject = (message) => fail(`${path}: ${message}`)
    if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
      reject('must define a workflow mapping')
      continue
    }
    if (
      workflow.permissions?.contents !== 'read' ||
      Object.values(workflow.permissions).some((value) => value !== 'read')
    )
      reject('must use read-only repository permissions')
    const events = workflow.on
    if (!events || typeof events !== 'object' || Array.isArray(events)) {
      reject('must define explicit workflow events')
      continue
    }
    if (name === 'ci.yml') {
      if (
        !events ||
        !('push' in events) ||
        !('pull_request' in events) ||
        Object.keys(events).some(
          (event) => !['push', 'pull_request'].includes(event),
        )
      )
        reject('CI must run on pushes and pull requests')
    } else {
      const dispatch = events?.workflow_dispatch
      if (
        !dispatch ||
        Object.keys(events).some((event) => event !== 'workflow_dispatch')
      )
        reject('release workflows must be manually dispatched')
      for (const [input, field] of [
        ['backend_version', 'spreeVersion'],
        ['backend_revision', 'spreeRevision'],
      ]) {
        const definition = dispatch?.inputs?.[input]
        if (
          definition?.type !== 'string' ||
          definition.required !== true ||
          definition.default !== sourceTarget[field]
        )
          reject(`${input} must require the selected source default`)
      }
    }
    const jobs = workflow.jobs
    if (!jobs || Object.keys(jobs).length !== 1 || !jobs[spec.job]) {
      reject(`must define the executable ${spec.job} job`)
      continue
    }
    const job = jobs[spec.job]
    if (
      job.if !== undefined ||
      job['continue-on-error'] !== undefined ||
      !Number.isInteger(job['timeout-minutes']) ||
      job['timeout-minutes'] < 1 ||
      job['timeout-minutes'] > 60 ||
      job['runs-on'] !== 'ubuntu-latest'
    )
      reject('required job must execute unconditionally with a bounded timeout')
    if (spec.environment && job.environment !== spec.environment)
      reject(`job must use the ${spec.environment} environment`)
    const steps = Array.isArray(job.steps) ? job.steps : []
    const runSteps = steps.filter((step) => typeof step?.run === 'string')
    const commands = runSteps.map((step) => step.run.trim())
    if (JSON.stringify(commands) !== JSON.stringify(spec.commands))
      reject(
        'required commands must execute in order without extra shell commands',
      )
    if (
      runSteps.some(
        (step) =>
          step.if !== undefined ||
          step['continue-on-error'] !== undefined ||
          step.shell !== undefined ||
          step.env !== undefined ||
          step['working-directory'] !== undefined,
      )
    )
      reject('required command steps cannot bypass the job configuration')
    if (
      job.defaults !== undefined ||
      workflow.defaults !== undefined ||
      job.permissions !== undefined
    )
      reject('required jobs cannot override command defaults or permissions')
    if (
      !steps.some(
        (step) =>
          step.uses === 'actions/checkout@v7' &&
          step.with?.['persist-credentials'] === false &&
          step.if === undefined,
      )
    )
      reject('must check out source without persisting credentials')
    if (
      !steps.some(
        (step) =>
          step.uses === 'pnpm/setup@v3' &&
          step.with?.runtime === 'node@22.22.0' &&
          step.with?.install === false &&
          step.if === undefined,
      )
    )
      reject('must install the pinned runtime before the frozen install')
    if (name === 'ci.yml') continue
    const env = { ...workflow.env, ...job.env }
    for (const [key, value] of Object.entries({
      E2E_SPREE_BACKEND_VERSION: '${{ inputs.backend_version }}',
      E2E_SPREE_BACKEND_REVISION: '${{ inputs.backend_revision }}',
      PLAYWRIGHT_BASE_URL: '${{ vars.VITE_STOREFRONT_URL }}',
    })) {
      if (env[key] !== value)
        reject(`${key} must bind the selected environment`)
    }
    if (name === 'staging-storefront-commerce.yml') {
      const confirmation = events?.workflow_dispatch?.inputs?.disposable_backend
      if (
        confirmation?.type !== 'boolean' ||
        confirmation.required !== true ||
        confirmation.default !== false
      )
        reject('must explicitly confirm a disposable backend')
      for (const [key, value] of Object.entries({
        E2E_COMMERCE_DISPOSABLE: '${{ inputs.disposable_backend }}',
        E2E_COMMERCE_RELEASE: 'true',
        E2E_ORDER_GROUP_FIXTURE_READY:
          '${{ vars.E2E_ORDER_GROUP_FIXTURE_READY }}',
        E2E_SPREE_COMMERCE_READY: '${{ vars.E2E_SPREE_COMMERCE_READY }}',
        E2E_COMMERCE_TARGET_URL: '${{ vars.VITE_STOREFRONT_URL }}',
        E2E_COMMERCE_PROBE_KEY: '${{ secrets.E2E_COMMERCE_PROBE_KEY }}',
      })) {
        if (env[key] !== value)
          reject(`${key} must preserve the commerce safety gate`)
      }
    } else if (Object.keys(env).some((key) => key.startsWith('E2E_COMMERCE_')))
      reject('read-only and production jobs cannot enable commerce writes')
  }
}
