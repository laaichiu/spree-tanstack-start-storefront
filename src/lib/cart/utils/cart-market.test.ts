import { describe, expect, it } from 'vitest'

import {
  CART_MARKET_MISMATCH_MESSAGE,
  assertSpreeCartResourceMatchesMarket,
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarket,
} from './cart-market'

describe('cart market compatibility', () => {
  it('accepts a cart from the selected market', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        {
          currency: 'usd',
          market_id: 'market-us',
        },
        {
          currencyCode: 'USD',
          marketId: 'market-us',
        },
      ),
    ).toBe(true)
  })

  it('rejects a cart from a different market id', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        {
          currency: 'USD',
          market_id: 'market-eu',
        },
        {
          currencyCode: 'USD',
          marketId: 'market-us',
        },
      ),
    ).toBe(false)
  })

  it('rejects a cart from a different currency when market id is unavailable', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        {
          currency: 'EUR',
        },
        {
          currencyCode: 'USD',
        },
      ),
    ).toBe(false)
  })

  it('throws a readable error for mismatched carts', () => {
    expect(() =>
      assertSpreeCartResourceMatchesMarket(
        {
          currency: 'EUR',
          market_id: 'market-eu',
        },
        {
          currencyCode: 'USD',
          marketId: 'market-us',
        },
      ),
    ).toThrow(CART_MARKET_MISMATCH_MESSAGE)
  })

  it('builds a stable cart market key from market id before currency', () => {
    expect(
      getCartMarketKey({
        currencyCode: 'USD',
        marketId: 'market-us',
      }),
    ).toBe('market:market-us')

    expect(
      getCartMarketKey({
        currencyCode: 'usd',
      }),
    ).toBe('currency:USD')
  })

  it('treats missing legacy cart market cookies as compatible', () => {
    expect(
      isCartMarketKeyCompatibleWithMarket(undefined, {
        currencyCode: 'USD',
        marketId: 'market-us',
      }),
    ).toBe(true)
  })

  it('rejects cart market cookies from a different selected market', () => {
    expect(
      isCartMarketKeyCompatibleWithMarket('market:market-eu', {
        currencyCode: 'USD',
        marketId: 'market-us',
      }),
    ).toBe(false)
  })

  it('accepts URL-encoded cart market cookie values', () => {
    expect(
      isCartMarketKeyCompatibleWithMarket('market%3Amarket-us', {
        currencyCode: 'USD',
        marketId: 'market-us',
      }),
    ).toBe(true)
  })
})
