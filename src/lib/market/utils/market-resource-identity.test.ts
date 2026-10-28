import { describe, expect, it } from 'vitest'

import {
  assertMarketResourceIsMarket,
  isMarketResourceId,
  MarketResourceTypeMismatchError,
} from './market-resource-identity'

describe('market resource identity', () => {
  it('accepts a non-empty market resource id', () => {
    expect(isMarketResourceId('mkt_123')).toBe(true)
    expect(() => assertMarketResourceIsMarket({ id: 'mkt_123' })).not.toThrow()
  })

  it.each([
    null,
    undefined,
    {},
    { id: '' },
    { id: 'prod_123' },
    { id: 'mkt_' },
  ])('rejects a non-market resource: %o', (resource) => {
    expect(() => assertMarketResourceIsMarket(resource)).toThrow(
      MarketResourceTypeMismatchError,
    )
  })
})
