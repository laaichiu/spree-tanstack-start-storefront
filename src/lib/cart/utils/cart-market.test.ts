import { describe, expect, it } from 'vitest'

import {
  assertSpreeCartResourceHasMarketIdentity,
  assertSpreeCartResourceMatchesMarket,
  CartMarketMismatchError,
  isSpreeCartResourceCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarketKey,
} from './cart-market'

const usMarket = {
  currencyCode: 'USD',
  marketId: 'market-us',
}

describe('cart market response ownership', () => {
  it('accepts a response with the exact market identity', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 'USD', market_id: 'market-us' },
        usMarket,
      ),
    ).toBe(true)
  })

  it('rejects a response from another market', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 'USD', market_id: 'market-ca' },
        usMarket,
      ),
    ).toBe(false)
  })

  it('rejects a response missing a requested market identity', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket({ currency: 'USD' }, usMarket),
    ).toBe(false)
  })

  it('rejects a response missing currency identity', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { market_id: 'market-us' },
        usMarket,
      ),
    ).toBe(false)
  })

  it('checks only currency when the persisted key has no market id', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarketKey(
        { currency: 'USD', market_id: 'market-us' },
        'currency:USD',
      ),
    ).toBe(true)
    expect(
      isSpreeCartResourceCompatibleWithMarketKey(
        { market_id: 'market-us' },
        'currency:USD',
      ),
    ).toBe(false)
  })

  it('accepts a marketless response only when its explicit market is also marketless', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 'USD', market_id: null },
        { currencyCode: 'USD', marketId: null },
      ),
    ).toBe(true)
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 'USD', market_id: null },
        usMarket,
      ),
    ).toBe(false)
  })

  it('raises the existing ownership error for incomplete identity', () => {
    expect(() =>
      assertSpreeCartResourceMatchesMarket({ currency: 'USD' }, usMarket),
    ).toThrow(CartMarketMismatchError)
  })

  it('fails closed when the market identity has an invalid runtime type', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 'USD', market_id: 123 },
        usMarket,
      ),
    ).toBe(false)
    expect(() =>
      assertSpreeCartResourceMatchesMarket(
        { currency: 'USD', market_id: { id: 'market-us' } },
        usMarket,
      ),
    ).toThrow(CartMarketMismatchError)
  })

  it('fails closed when the currency identity has an invalid runtime type', () => {
    expect(
      isSpreeCartResourceCompatibleWithMarket(
        { currency: 840, market_id: 'market-us' },
        usMarket,
      ),
    ).toBe(false)
    expect(() =>
      assertSpreeCartResourceMatchesMarket(
        { currency: { code: 'USD' }, market_id: 'market-us' },
        usMarket,
      ),
    ).toThrow(CartMarketMismatchError)
  })

  it.each([
    { currency: 'USD', market_id: 123 },
    { currency: '   ', market_id: 'market-us' },
    { market_id: 'market-us' },
  ])('rejects a cart with an unusable market identity: %o', (cart) => {
    expect(() =>
      assertSpreeCartResourceHasMarketIdentity(cart, usMarket),
    ).toThrow(CartMarketMismatchError)
  })

  it('allows a valid cart identity to be checked for market compatibility separately', () => {
    expect(() =>
      assertSpreeCartResourceHasMarketIdentity(
        { currency: 'EUR', market_id: 'market-eu' },
        usMarket,
      ),
    ).not.toThrow()
  })
})
