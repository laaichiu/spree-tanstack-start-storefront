import { describe, expect, it } from 'vitest'

import { readServerEnv } from './env.server'

describe('server environment', () => {
  it('trims and returns valid Spree configuration', () => {
    expect(
      readServerEnv({
        SPREE_API_URL: '  https://api.example.com/v3  ',
        SPREE_PUBLISHABLE_KEY: '  pk_test_storefront  ',
      }),
    ).toEqual({
      spreeApiUrl: 'https://api.example.com/v3',
      spreePublishableKey: 'pk_test_storefront',
    })
  })

  it('requires both Spree values', () => {
    expect(() =>
      readServerEnv({ SPREE_PUBLISHABLE_KEY: 'pk_test_storefront' }),
    ).toThrow('SPREE_API_URL is required')
    expect(() =>
      readServerEnv({ SPREE_API_URL: 'https://api.example.com' }),
    ).toThrow('SPREE_PUBLISHABLE_KEY is required')
  })

  it('rejects non-HTTP API URLs', () => {
    for (const spreeApiUrl of ['not-a-url', 'ftp://api.example.com']) {
      expect(() =>
        readServerEnv({
          SPREE_API_URL: spreeApiUrl,
          SPREE_PUBLISHABLE_KEY: 'pk_test_storefront',
        }),
      ).toThrow('SPREE_API_URL must be a valid HTTP or HTTPS URL')
    }
  })

  it('rejects secret or malformed API keys', () => {
    for (const spreePublishableKey of [
      'sk_test_server_secret',
      'storefront-key',
    ]) {
      expect(() =>
        readServerEnv({
          SPREE_API_URL: 'https://api.example.com',
          SPREE_PUBLISHABLE_KEY: spreePublishableKey,
        }),
      ).toThrow(
        'SPREE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
      )
    }
  })
})
