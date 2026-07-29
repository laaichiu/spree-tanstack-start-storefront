import { describe, expect, it } from 'vitest'

import { buildServerCheckoutPaymentReturnUrl } from './payment-return-url.server'

describe('server checkout payment return URL', () => {
  it('builds a URL from trusted market and cart identity', () => {
    expect(
      buildServerCheckoutPaymentReturnUrl({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
      }),
    ).toBe('http://localhost:3006/us/en/confirm-payment/cart_123')
  })

  it('encodes cart identity path segments', () => {
    expect(
      buildServerCheckoutPaymentReturnUrl({
        cartId: 'cart/attacker',
        country: 'us',
        locale: 'en',
      }),
    ).toBe('http://localhost:3006/us/en/confirm-payment/cart%2Fattacker')
  })
})
