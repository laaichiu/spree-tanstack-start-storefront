// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { getExpressCheckoutElementsKey } from './checkout-express-checkout'

describe('Express checkout Elements ownership', () => {
  it('changes the Elements owner when cart amount or currency changes', () => {
    const initialKey = getExpressCheckoutElementsKey({
      amount: 2500,
      cartId: 'cart_123',
      currencyCode: 'USD',
    })

    expect(
      getExpressCheckoutElementsKey({
        amount: 3000,
        cartId: 'cart_123',
        currencyCode: 'USD',
      }),
    ).not.toBe(initialKey)
    expect(
      getExpressCheckoutElementsKey({
        amount: 2500,
        cartId: 'cart_123',
        currencyCode: 'CAD',
      }),
    ).not.toBe(initialKey)
    expect(
      getExpressCheckoutElementsKey({
        amount: 2500,
        cartId: 'cart_new',
        currencyCode: 'USD',
      }),
    ).not.toBe(initialKey)
  })
})
