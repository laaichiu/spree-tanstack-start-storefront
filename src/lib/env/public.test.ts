import { describe, expect, it } from 'vitest'

import { readPublicBuildEnv } from './public'

describe('readPublicBuildEnv', () => {
  it('normalizes the public storefront origin and optional features', () => {
    expect(
      readPublicBuildEnv({
        VITE_STOREFRONT_REVIEWS_ENABLED: ' YES ',
        VITE_STOREFRONT_NAME: ' Shop ',
        VITE_STOREFRONT_URL: 'https://shop.example.com/',
        VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_storefront',
      }),
    ).toEqual({
      reviewsEnabled: true,
      storefrontName: 'Shop',
      storefrontUrl: 'https://shop.example.com',
      stripePublishableKey: 'pk_test_storefront',
    })
  })

  it('uses the documented local origin when no storefront URL is configured', () => {
    expect(readPublicBuildEnv({})).toEqual({
      reviewsEnabled: false,
      storefrontName: null,
      storefrontUrl: 'http://localhost:3006',
      stripePublishableKey: null,
    })
  })

  it('rejects malformed public values', () => {
    expect(() =>
      readPublicBuildEnv({ VITE_STOREFRONT_URL: 'javascript:alert(1)' }),
    ).toThrow('VITE_STOREFRONT_URL must be a valid HTTP or HTTPS origin')
    expect(() =>
      readPublicBuildEnv({ VITE_STRIPE_PUBLISHABLE_KEY: 'sk_live_secret' }),
    ).toThrow(
      'VITE_STRIPE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
    )
  })

  it('requires a secure origin and explicit feature values for production', () => {
    expect(() =>
      readPublicBuildEnv(
        { VITE_STOREFRONT_URL: 'http://shop.example.com' },
        { strictProduction: true },
      ),
    ).toThrow('VITE_STOREFRONT_URL must use HTTPS in production')

    expect(() =>
      readPublicBuildEnv(
        {
          VITE_STOREFRONT_REVIEWS_ENABLED: 'enabled',
          VITE_STOREFRONT_URL: 'https://shop.example.com',
        },
        { strictProduction: true },
      ),
    ).toThrow(
      'VITE_STOREFRONT_REVIEWS_ENABLED must be a boolean value (true or false)',
    )
  })

  it('allows localhost HTTP outside strict production validation', () => {
    expect(
      readPublicBuildEnv({ VITE_STOREFRONT_URL: 'http://localhost:3002' })
        .storefrontUrl,
    ).toBe('http://localhost:3002')
  })
})
