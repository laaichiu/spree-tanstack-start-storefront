import { describe, expect, it } from 'vitest'

import {
  isCheckoutShellPath,
  isCheckoutShellRouteId,
} from './checkout-shell-policy'

describe('checkout shell policy', () => {
  it.each([
    '/us/en/checkout',
    '/us/en/checkout/cart_123',
    '/us/en/confirm-payment/cart_123',
    '/us/en/order-placed/cart_123',
  ])('recognizes checkout shell path %s', (pathname) => {
    expect(isCheckoutShellPath(pathname)).toBe(true)
  })

  it.each(['/us/en/products', '/us/en/account', '/us/en/checkout-preview'])(
    'keeps non-checkout path %s outside the shell',
    (pathname) => {
      expect(isCheckoutShellPath(pathname)).toBe(false)
    },
  )

  it('recognizes the route ids that render the checkout shell', () => {
    expect(isCheckoutShellRouteId('/$country/$locale/checkout/$id')).toBe(true)
    expect(isCheckoutShellRouteId('/$country/$locale/products')).toBe(false)
  })
})
