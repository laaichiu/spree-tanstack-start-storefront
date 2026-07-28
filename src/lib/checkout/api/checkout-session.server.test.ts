import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import { setCartCookies } from '@/lib/cookies/cart-cookie.server'

import { requireCheckoutCustomerCartAssociation } from './checkout-session.server'

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: vi.fn(),
}))

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: vi.fn(),
  getCartCookieState: vi.fn(),
  setCartCookies: vi.fn(),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_123',
}

describe('requireCheckoutCustomerCartAssociation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomerAccessToken).mockReturnValue('customer-token')
  })

  it('associates a guest cart before a saved payment method is used', async () => {
    const associate = vi.fn().mockResolvedValue({
      currency: 'USD',
      id: 'cart_123',
      market_id: 'market_123',
      token: 'next-cart-token',
    })

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client: { carts: { associate } } as never,
        market,
      }),
    ).resolves.toEqual({
      spreeToken: 'cart-token',
      token: 'customer-token',
    })

    expect(associate).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'cart-token',
      token: 'customer-token',
    })
    expect(setCartCookies).toHaveBeenCalledWith({
      cartId: 'cart_123',
      cartMarketKey: 'market:market_123',
      cartToken: 'next-cart-token',
    })
  })

  it('rejects saved payment methods when no customer session is available', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const associate = vi.fn()

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client: { carts: { associate } } as never,
        market,
      }),
    ).rejects.toThrow('Sign in again to use a saved payment method')

    expect(associate).not.toHaveBeenCalled()
  })

  it('does not expose backend association failures', async () => {
    const associate = vi.fn().mockRejectedValue(new Error('backend details'))

    await expect(
      requireCheckoutCustomerCartAssociation({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client: { carts: { associate } } as never,
        market,
      }),
    ).rejects.toThrow('Sign in again to use a saved payment method')
  })
})
