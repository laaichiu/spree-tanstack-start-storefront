// @vitest-environment node

import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyCommerceTarget } from '../../../tools/verify-commerce-target.mjs'
import { handleCommerceTestProbe } from './commerce-test-probe.server'

const environment = {
  E2E_COMMERCE_DISPOSABLE: 'true',
  E2E_COMMERCE_PROBE_KEY: 'synthetic-commerce-probe-key-with-32-characters',
  E2E_COMMERCE_TARGET_URL: 'https://store.example.com',
  SPREE_API_URL: 'https://api.example.com',
  SPREE_PUBLISHABLE_KEY: 'pk_synthetic',
  SPREE_CHANNEL: 'online',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_synthetic',
}

function mockWorker(patch: Record<string, string | undefined> = {}) {
  const actual = { ...environment, ...patch }
  const fetch = vi.fn((input: URL, init?: RequestInit) =>
    handleCommerceTestProbe(
      new Request(input, init),
      actual,
      actual.VITE_STRIPE_PUBLISHABLE_KEY,
    ),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => vi.unstubAllGlobals())

describe('disposable commerce target identity', () => {
  it('proves the runtime tuple without returning keys or backend topology', async () => {
    const fetch = mockWorker()
    await verifyCommerceTarget(environment.E2E_COMMERCE_TARGET_URL, environment)
    const [input, init] = fetch.mock.calls[0]
    const response = await handleCommerceTestProbe(
      new Request(input, init),
      environment,
      environment.VITE_STRIPE_PUBLISHABLE_KEY,
    )
    expect(await response.json()).toEqual({
      signature: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(fetch.mock.calls[0][1]?.redirect).toBe('error')
  })

  it.each([
    { SPREE_API_URL: 'https://other.example.com' },
    { SPREE_CHANNEL: 'another-channel' },
    { SPREE_PUBLISHABLE_KEY: 'pk_another' },
    { VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_another' },
    {
      E2E_COMMERCE_PROBE_KEY:
        'a-different-synthetic-probe-secret-with-32-characters',
    },
    { E2E_COMMERCE_DISPOSABLE: 'false' },
    { VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_synthetic' },
  ])(
    'rejects a mismatched or unsafe Worker configuration: %j',
    async (patch) => {
      mockWorker(patch)
      await expect(
        verifyCommerceTarget(environment.E2E_COMMERCE_TARGET_URL, environment),
      ).rejects.toThrow()
    },
  )

  it('rejects an unconfirmed storefront before sending a probe', async () => {
    const fetch = mockWorker()
    await expect(
      verifyCommerceTarget('https://another.example.com', environment),
    ).rejects.toThrow('exactly confirm')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects replaying a response to another nonce', async () => {
    const fetch = mockWorker()
    await verifyCommerceTarget(environment.E2E_COMMERCE_TARGET_URL, environment)
    const [input, init] = fetch.mock.calls[0]
    const response = await handleCommerceTestProbe(
      new Request(input, init),
      environment,
      environment.VITE_STRIPE_PUBLISHABLE_KEY,
    )
    const signature = await response.json()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(signature)),
    )
    await expect(
      verifyCommerceTarget(environment.E2E_COMMERCE_TARGET_URL, environment),
    ).rejects.toThrow('differ')
  })

  it('returns no configuration for unauthenticated probes', async () => {
    const response = await handleCommerceTestProbe(
      new Request('https://store.example.com/api/commerce-test-probe'),
      environment,
      'pk_test_synthetic',
    )
    expect(response.status).toBe(404)
    expect(await response.text()).toBe('')
  })

  it('verifies request authentication before reading server configuration', async () => {
    const challenge = 'a'.repeat(64)
    const proof = createHmac('sha256', 'wrong-secret')
      .update(`request:${challenge}`)
      .digest('hex')
    const response = await handleCommerceTestProbe(
      new Request('https://store.example.com/api/commerce-test-probe', {
        headers: {
          'x-storefront-test-challenge': challenge,
          'x-storefront-test-proof': proof,
        },
      }),
      { ...environment, SPREE_API_URL: undefined },
      'pk_test_synthetic',
    )
    expect(response.status).toBe(404)
  })
})
