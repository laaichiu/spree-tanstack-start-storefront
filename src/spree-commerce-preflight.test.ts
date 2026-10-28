// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const directory = mkdtempSync(join(tmpdir(), 'storefront-preflight-test-'))
const bin = join(directory, 'bin')
const backend = join(directory, 'backend')
mkdirSync(bin)
mkdirSync(backend)
writeFileSync(join(backend, 'Gemfile'), '')
writeFileSync(
  join(bin, 'bundle'),
  '#!/bin/sh\nprintf \'%s\\n\' "$E2E_PREFLIGHT_RESULT"\n',
  { mode: 0o700 },
)

afterAll(() => rmSync(directory, { recursive: true, force: true }))

const aligned = {
  missing_columns: [],
  invalid_money_columns: [],
  pending_migrations: false,
  payment_provider_available: true,
  publishable_key_available: true,
  active_test_gateway: true,
}

function verify(
  patch: Record<string, unknown> = {},
  overrides: Record<string, string | undefined> = {},
) {
  const env = { ...process.env }
  delete env.E2E_SPREE_BACKEND_VERSION
  delete env.E2E_SPREE_BACKEND_REVISION
  return spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('../tools/check-spree-commerce-runtime.mjs', import.meta.url),
      ),
    ],
    {
      env: {
        ...env,
        PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
        E2E_SPREE_DEMO_PATH: backend,
        E2E_PREFLIGHT_RESULT: JSON.stringify({ ...aligned, ...patch }),
        E2E_COMMERCE_DISPOSABLE: 'true',
        SPREE_PUBLISHABLE_KEY: 'pk_synthetic',
        VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_synthetic',
        ...overrides,
      },
      encoding: 'utf8',
      timeout: 10_000,
    },
  )
}

describe('commerce preflight schema results', () => {
  it('accepts aligned schema and a store-scoped test gateway', () => {
    expect(verify().status).toBe(0)
  })

  it.each([
    [{ active_test_gateway: 'yes' }, 'incomplete schema result'],
    [{ pending_migrations: true }, 'pending migrations'],
    [
      { invalid_money_columns: ['spree_prices.amount'] },
      'decimal(19,4); incompatible spree_prices.amount',
    ],
    [
      { missing_columns: ['active_storage_blobs.store_id'] },
      'missing active_storage_blobs.store_id',
    ],
    [{ pending_migrations: undefined }, 'incomplete schema result'],
    [{ invalid_money_columns: undefined }, 'incomplete schema result'],
    [
      { active_test_gateway: false },
      'must be active for the selected Spree store',
    ],
  ])('rejects an incompatible preflight result %j', (patch, message) => {
    const result = verify(patch)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(message)
  })
})

describe('commerce execution gates', () => {
  it('rejects local writes without disposable-backend confirmation', () => {
    expect(verify({}, { E2E_COMMERCE_DISPOSABLE: undefined }).status).toBe(1)
  })
  it('requires OrderGroup fixtures for remote release coverage', () => {
    const result = verify(
      {},
      {
        E2E_SPREE_BACKEND_VERSION: '6.0.0',
        E2E_SPREE_DEMO_PATH: undefined,
        E2E_COMMERCE_RELEASE: 'true',
        E2E_SPREE_COMMERCE_READY: 'true',
        E2E_ORDER_GROUP_FIXTURE_READY: undefined,
      },
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('E2E_ORDER_GROUP_FIXTURE_READY')
  })
  it('accepts explicitly attested remote release fixtures and test payments', () => {
    expect(
      verify(
        {},
        {
          E2E_SPREE_BACKEND_VERSION: '6.0.0',
          E2E_SPREE_DEMO_PATH: undefined,
          E2E_COMMERCE_RELEASE: 'true',
          E2E_SPREE_COMMERCE_READY: 'true',
          E2E_ORDER_GROUP_FIXTURE_READY: 'true',
        },
      ).status,
    ).toBe(0)
  })
})
