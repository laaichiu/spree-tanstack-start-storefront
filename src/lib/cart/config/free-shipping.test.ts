import { describe, expect, it } from 'vitest'

import { readCartFreeShippingPromotion } from './free-shipping'

const ENV_KEY = 'VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT'

describe('readCartFreeShippingPromotion', () => {
  it.each([undefined, '', '   ', 'free', 'Infinity', '0', '-1'])(
    'disables storefront messaging for an invalid threshold of %s',
    (threshold) => {
      expect(
        readCartFreeShippingPromotion({ [ENV_KEY]: threshold }, 'USD'),
      ).toBeNull()
    },
  )

  it('creates a currency-aware storefront capability from an explicit map', () => {
    expect(
      readCartFreeShippingPromotion({ [ENV_KEY]: 'USD=100, CAD=140' }, 'CAD'),
    ).toEqual({
      comparison: 'greaterThan',
      threshold: {
        amount: 140,
        currencyCode: 'CAD',
      },
    })
  })

  it('keeps the legacy bare amount scoped to USD only', () => {
    expect(
      readCartFreeShippingPromotion({ [ENV_KEY]: '100' }, 'USD'),
    ).not.toBeNull()
    expect(
      readCartFreeShippingPromotion({ [ENV_KEY]: '100' }, 'CAD'),
    ).toBeNull()
  })

  it('ignores malformed or duplicate currency entries', () => {
    for (const value of ['USD=100,USD=120', 'USD=free', 'US=100']) {
      expect(
        readCartFreeShippingPromotion({ [ENV_KEY]: value }, 'USD'),
      ).toBeNull()
    }
  })
})
