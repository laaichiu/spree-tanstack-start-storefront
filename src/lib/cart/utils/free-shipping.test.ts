import { describe, expect, it } from 'vitest'

import type { CartFreeShippingPromotion } from '@/lib/cart/model/cart'

import { getCartFreeShippingProgress } from './free-shipping'

const promotion: CartFreeShippingPromotion = {
  comparison: 'greaterThan',
  threshold: { amount: 100, currencyCode: 'USD' },
}

function cartWithItemTotal(amount: number, currencyCode = 'USD') {
  return { itemTotal: { amount, currencyCode } }
}

describe('getCartFreeShippingProgress', () => {
  it('uses the Spree item total without applying discounts a second time', () => {
    expect(
      getCartFreeShippingProgress(cartWithItemTotal(40), promotion),
    ).toEqual({
      isThresholdReached: false,
      progressPercent: 40,
      remaining: { amount: 60.01, currencyCode: 'USD' },
    })
  })

  it('keeps a strict greater-than threshold locked at the configured amount', () => {
    expect(
      getCartFreeShippingProgress(cartWithItemTotal(100), promotion),
    ).toEqual({
      isThresholdReached: false,
      progressPercent: 99,
      remaining: { amount: 0.01, currencyCode: 'USD' },
    })
  })

  it('marks the threshold as reached only above the configured amount', () => {
    expect(
      getCartFreeShippingProgress(cartWithItemTotal(100.01), promotion),
    ).toEqual({
      isThresholdReached: true,
      progressPercent: 100,
      remaining: { amount: 0, currencyCode: 'USD' },
    })
  })

  it('uses the active currency minor unit', () => {
    const yenPromotion: CartFreeShippingPromotion = {
      comparison: 'greaterThan',
      threshold: { amount: 100, currencyCode: 'JPY' },
    }

    expect(
      getCartFreeShippingProgress(cartWithItemTotal(100, 'JPY'), yenPromotion),
    ).toMatchObject({
      isThresholdReached: false,
      remaining: { amount: 1, currencyCode: 'JPY' },
    })
  })

  it('hides progress for a stale cart in another currency', () => {
    expect(
      getCartFreeShippingProgress(cartWithItemTotal(90, 'EUR'), promotion),
    ).toBeNull()
  })
})
