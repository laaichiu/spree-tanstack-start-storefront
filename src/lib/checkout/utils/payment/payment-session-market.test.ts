import { describe, expect, it } from 'vitest'

import {
  assertPaymentSessionMatchesMarket,
  isPaymentSessionMarketMismatchError,
} from './payment-session-market'

describe('payment-session market assertion', () => {
  it('compares currency case-insensitively', () => {
    expect(() =>
      assertPaymentSessionMatchesMarket(
        { currency: 'usd' },
        { currencyCode: 'USD' },
      ),
    ).not.toThrow()
  })

  it('rejects a session from another market', () => {
    try {
      assertPaymentSessionMatchesMarket(
        { currency: 'EUR' },
        { currencyCode: 'USD' },
      )
    } catch (error) {
      expect(isPaymentSessionMarketMismatchError(error)).toBe(true)
      return
    }

    throw new Error('Expected a payment-session market mismatch.')
  })

  it.each([
    null,
    42,
    { currency: undefined },
    { currency: null },
    { currency: '  ' },
  ])('rejects a session with incomplete currency identity: %o', (session) => {
    expect(() =>
      assertPaymentSessionMatchesMarket(session, { currencyCode: 'USD' }),
    ).toThrow('different market')
  })
})
