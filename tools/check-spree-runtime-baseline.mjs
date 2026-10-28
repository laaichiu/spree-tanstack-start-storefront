import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const baselinePath = resolve(
  repositoryRoot,
  'config/spree-runtime-baseline.json',
)

function fail(message) {
  console.error(`Spree runtime baseline check failed: ${message}`)
  process.exit(1)
}

function readJson(path, label) {
  if (!existsSync(path)) {
    fail(`${label} does not exist at ${path}`)
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`)
  }
}

const baseline = readJson(baselinePath, 'runtime baseline')
const requiredFields = ['status', 'spreeVersion', 'spreeRevision', 'sdkVersion']

for (const field of requiredFields) {
  if (typeof baseline[field] !== 'string' || baseline[field].length === 0) {
    fail(`runtime baseline field ${field} must be a non-empty string`)
  }
}

if (baseline.status !== 'active') {
  fail(
    `the recorded executable baseline is ${baseline.status}; provision and verify config/spree-6-source-target.json before running browser or release evidence`,
  )
}

const sdkPackagePath = fileURLToPath(
  new URL('../node_modules/@spree/sdk/package.json', import.meta.url),
)
const sdkPackage = readJson(sdkPackagePath, '@spree/sdk package')

if (sdkPackage.version !== baseline.sdkVersion) {
  fail(
    `@spree/sdk ${sdkPackage.version} is installed, but the selected baseline requires ${baseline.sdkVersion}`,
  )
}

const attestedVersion = process.env.E2E_SPREE_BACKEND_VERSION?.trim()
const attestedRevision = process.env.E2E_SPREE_BACKEND_REVISION?.trim()
const requiresRevision = process.argv.includes('--require-revision')

let actualRevision
let actualVersion = baseline.spreeVersion
let backendSource

if (attestedVersion || attestedRevision) {
  if (!attestedVersion) {
    fail(
      'a remote backend attestation must include E2E_SPREE_BACKEND_VERSION; E2E_SPREE_BACKEND_REVISION is optional source provenance',
    )
  }

  actualVersion = attestedVersion
  actualRevision = attestedRevision
  backendSource = 'remote backend attestation'
} else {
  const configuredBackendPath = process.env.E2E_SPREE_DEMO_PATH?.trim()
  if (!configuredBackendPath) {
    fail(
      'set E2E_SPREE_DEMO_PATH for a local backend or E2E_SPREE_BACKEND_VERSION for a remote one',
    )
  }

  if (!isAbsolute(configuredBackendPath)) {
    fail('E2E_SPREE_DEMO_PATH must be an absolute path')
  }

  const backendPath = configuredBackendPath
  const lockfilePath = resolve(backendPath, 'Gemfile.lock')

  if (!existsSync(lockfilePath)) {
    fail(
      `Spree Gemfile.lock does not exist at ${lockfilePath}; set E2E_SPREE_DEMO_PATH for a local backend or E2E_SPREE_BACKEND_VERSION for a remote one`,
    )
  }

  const lockfile = readFileSync(lockfilePath, 'utf8')
  // A lockfile can contain several unrelated Git sources. The revision and
  // version must come from the same block that actually owns the Spree gem.
  const sources = lockfile.split(/(?=^(?:GIT|GEM|PATH)\r?$)/m)
  const spreeSources = sources.flatMap((source) => {
    const version = source.match(/^    spree \(([^)]+)\)\r?$/m)?.[1]
    if (!version) return []
    const revision =
      source.startsWith('GIT\n') || source.startsWith('GIT\r\n')
        ? source.match(/^  revision: ([0-9a-f]{40})\r?$/m)?.[1]
        : undefined
    if (source.startsWith('GIT') && !revision) {
      fail('the Spree Git source must include a complete revision')
    }
    if (source.startsWith('PATH')) {
      fail('a path-based Spree dependency cannot establish source provenance')
    }
    return [{ version, revision }]
  })

  if (spreeSources.length !== 1) {
    fail('Gemfile.lock must contain exactly one Spree source')
  }

  actualRevision = spreeSources[0].revision
  actualVersion = spreeSources[0].version
  backendSource = actualRevision
    ? lockfilePath
    : `${lockfilePath} (no Git revision in Spree source)`
}

if (requiresRevision && !actualRevision) {
  fail(
    'release workflows require E2E_SPREE_BACKEND_REVISION or a Git revision in the local Spree source',
  )
}

if (actualVersion !== baseline.spreeVersion) {
  fail(
    `Spree ${actualVersion} is selected, but the runtime baseline requires ${baseline.spreeVersion}`,
  )
}

if (actualRevision && actualRevision !== baseline.spreeRevision) {
  fail(
    `Spree revision ${actualRevision} is selected, but the runtime baseline requires ${baseline.spreeRevision}. Re-run compatibility tests before updating the baseline`,
  )
}

console.log(
  `Spree dependency tuple matches the selected baseline: ${actualVersion}${actualRevision ? ` @ ${actualRevision}` : ''}, @spree/sdk ${sdkPackage.version} (${backendSource}); local runtime evidence: ${baseline.verificationStatus ?? 'not recorded'}`,
)
