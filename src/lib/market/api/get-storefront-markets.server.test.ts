import { describe, expect, it } from 'vitest'

import {
  StorefrontMarketsUnavailableError,
  resolveStorefrontMarkets,
} from './get-storefront-markets.server'

describe('storefront market availability policy', () => {
  it('fails closed in production when the verified market list is unavailable', () => {
    expect(() => resolveStorefrontMarkets([], { production: true })).toThrow(
      StorefrontMarketsUnavailableError,
    )
  })

  it('keeps the development fallback explicit', () => {
    expect(resolveStorefrontMarkets([], { production: false })).toHaveLength(1)
  })
})
