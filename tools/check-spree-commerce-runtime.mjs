import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCommerceEnvironment } from './commerce-environment.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const baseline = JSON.parse(
  readFileSync(
    resolve(repositoryRoot, 'config/spree-runtime-baseline.json'),
    'utf8',
  ),
)

function fail(message) {
  console.error(`Spree commerce runtime check failed: ${message}`)
  process.exit(1)
}

const environment = readCommerceEnvironment()
function readEnvironmentValue(name) {
  return environment[name]?.trim() || undefined
}

if (process.env.E2E_COMMERCE_DISPOSABLE !== 'true') {
  fail(
    'set E2E_COMMERCE_DISPOSABLE=true only for a disposable commerce backend',
  )
}
const attestedVersion = process.env.E2E_SPREE_BACKEND_VERSION?.trim()
const attestedRevision = process.env.E2E_SPREE_BACKEND_REVISION?.trim()
if (
  process.env.E2E_COMMERCE_RELEASE === 'true' &&
  (attestedVersion ||
    attestedRevision ||
    !process.env.E2E_SPREE_DEMO_PATH?.trim()) &&
  process.env.E2E_ORDER_GROUP_FIXTURE_READY !== 'true'
) {
  fail('release commerce evidence requires E2E_ORDER_GROUP_FIXTURE_READY=true')
}

const issues = []
const spreePublishableKey = readEnvironmentValue('SPREE_PUBLISHABLE_KEY')

if (attestedVersion || attestedRevision) {
  if (process.env.E2E_SPREE_COMMERCE_READY !== 'true') {
    issues.push(
      'a remote backend must set E2E_SPREE_COMMERCE_READY=true only after its schema and Stripe test gateway pass the deployment readiness checks',
    )
  }
} else {
  const configuredBackendPath = process.env.E2E_SPREE_DEMO_PATH?.trim()
  if (!configuredBackendPath) {
    fail('set E2E_SPREE_DEMO_PATH before running a local commerce preflight')
  }

  if (!isAbsolute(configuredBackendPath)) {
    fail('E2E_SPREE_DEMO_PATH must be an absolute path')
  }

  const backendPath = configuredBackendPath
  const schemaRequirements = baseline.commerceSchema
  const moneySchema = baseline.commerceMoneySchema

  if (!existsSync(resolve(backendPath, 'Gemfile'))) {
    fail(`local backend does not exist at ${backendPath}`)
  }

  if (
    !schemaRequirements ||
    typeof schemaRequirements !== 'object' ||
    Array.isArray(schemaRequirements)
  ) {
    fail('commerceSchema must define the required database columns')
  }

  if (
    !moneySchema ||
    !Number.isInteger(moneySchema.precision) ||
    !Number.isInteger(moneySchema.scale) ||
    !moneySchema.columns ||
    typeof moneySchema.columns !== 'object' ||
    Array.isArray(moneySchema.columns)
  ) {
    fail(
      'commerceMoneySchema must define decimal precision, scale, and columns',
    )
  }

  const railsScript = `
require "json"
stage = "schema"
begin
  requirements = JSON.parse(ENV.fetch("E2E_COMMERCE_SCHEMA"))
  connection = ActiveRecord::Base.connection
  missing_columns = requirements.flat_map do |table, columns|
    columns.reject { |column| connection.column_exists?(table, column) }
           .map { |column| "#{table}.#{column}" }
  end
  money_schema = JSON.parse(ENV.fetch("E2E_COMMERCE_MONEY_SCHEMA"))
  invalid_money_columns = money_schema.fetch("columns").flat_map do |table, names|
    columns = connection.table_exists?(table) ? connection.columns(table).index_by(&:name) : {}
    names.filter_map do |name|
      column = columns[name]
      "#{table}.#{name}" unless column && column.type == :decimal &&
        column.precision == money_schema.fetch("precision") && column.scale == money_schema.fetch("scale")
    end
  end
  pending_migrations = ActiveRecord::Base.connection_pool.migration_context.needs_migration?
  stage = "payment provider"
  provider_type = ENV.fetch("E2E_PAYMENT_PROVIDER")
  provider_class_available = provider_type.safe_constantize.present?
  stage = "publishable key"
  publishable_key = Spree::ApiKey.active.publishable.find_by(token: ENV.fetch("E2E_SPREE_PUBLISHABLE_KEY"))
  store = publishable_key&.store
  stage = "payment gateway"
  gateway = provider_class_available && store ? store.payment_methods.active.find_by(type: provider_type) : nil
  secret_key = gateway&.preferred_secret_key.to_s
  puts JSON.generate(
    missing_columns: missing_columns,
    invalid_money_columns: invalid_money_columns,
    pending_migrations: pending_migrations,
    payment_provider_available: provider_class_available,
    publishable_key_available: publishable_key.present?,
    active_test_gateway: gateway.present? && secret_key.start_with?("sk_test_")
  )
rescue StandardError => error
  puts JSON.generate(
    preflight_error: error.class.name,
    preflight_stage: stage
  )
end
`

  let result

  try {
    const output = execFileSync(
      'bundle',
      ['exec', 'rails', 'runner', railsScript],
      {
        cwd: backendPath,
        encoding: 'utf8',
        timeout: 60_000,
        env: {
          ...process.env,
          E2E_COMMERCE_SCHEMA: JSON.stringify(schemaRequirements),
          E2E_COMMERCE_MONEY_SCHEMA: JSON.stringify(moneySchema),
          E2E_PAYMENT_PROVIDER: baseline.paymentProvider,
          E2E_SPREE_PUBLISHABLE_KEY: spreePublishableKey ?? '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    result = JSON.parse(output.trim().split(/\r?\n/).at(-1))
  } catch {
    fail(`could not run the Rails commerce preflight in ${backendPath}`)
  }

  if (result.preflight_error) {
    fail(
      `Rails commerce preflight failed during ${result.preflight_stage} (${result.preflight_error})`,
    )
  }

  if (
    !Array.isArray(result.missing_columns) ||
    !Array.isArray(result.invalid_money_columns) ||
    typeof result.pending_migrations !== 'boolean' ||
    ![
      'payment_provider_available',
      'publishable_key_available',
      'active_test_gateway',
    ].every((field) => typeof result[field] === 'boolean')
  ) {
    fail('Rails commerce preflight returned an incomplete schema result')
  }

  if (result.pending_migrations) {
    issues.push('the local backend has pending migrations')
  }

  if (result.invalid_money_columns.length > 0) {
    issues.push(
      `the local backend money schema must use decimal(${moneySchema.precision},${moneySchema.scale}); incompatible ${result.invalid_money_columns.join(', ')}`,
    )
  }

  if (result.missing_columns.length > 0) {
    issues.push(
      `the local backend schema is stale; missing ${result.missing_columns.join(', ')}. Rebuild the pre-release test database from the selected Spree revision`,
    )
  }

  if (!result.payment_provider_available) {
    issues.push(
      `${baseline.paymentProvider} is not installed in the local backend`,
    )
  } else if (!result.publishable_key_available) {
    issues.push(
      'SPREE_PUBLISHABLE_KEY must select an active local Spree publishable key',
    )
  } else if (!result.active_test_gateway) {
    issues.push(
      `${baseline.paymentProvider} must be active for the selected Spree store with an sk_test_ secret`,
    )
  }
}

const publishableKey = readEnvironmentValue('VITE_STRIPE_PUBLISHABLE_KEY')

if (!publishableKey?.startsWith('pk_test_')) {
  issues.push('VITE_STRIPE_PUBLISHABLE_KEY must use a pk_test_ key')
}

if (issues.length > 0) {
  fail(issues.join('; '))
}

console.log(
  attestedVersion || attestedRevision
    ? 'Spree commerce runtime attestation accepted for the remote test environment'
    : 'Spree commerce runtime verified with aligned schema, store-scoped gateway, and Stripe test mode',
)
