import { describe, expect, it } from 'vitest'

import { isCheckoutOrder } from './checkout-order'

describe('isCheckoutOrder', () => {
  it('accepts mapped checkout orders with payment methods and requirements', () => {
    const order = {
      paymentMethods: [],
      requirements: [],
    }

    expect(isCheckoutOrder(order)).toBe(true)
  })

  it('rejects cart summaries that do not include checkout fields', () => {
    expect(
      isCheckoutOrder({
        id: 'cart_123',
        items: [],
      }),
    ).toBe(false)
  })

  it('rejects malformed checkout field shapes', () => {
    expect(
      isCheckoutOrder({
        paymentMethods: null,
        requirements: [],
      }),
    ).toBe(false)
    expect(
      isCheckoutOrder({
        paymentMethods: [],
        requirements: 'address',
      }),
    ).toBe(false)
  })

  it('rejects missing values', () => {
    expect(isCheckoutOrder(null)).toBe(false)
    expect(isCheckoutOrder(undefined)).toBe(false)
  })
})
