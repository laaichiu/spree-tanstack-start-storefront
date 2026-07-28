import { describe, expect, it } from 'vitest'

import {
  getCheckoutAccountLoginHref,
  getCheckoutPath,
  getCheckoutRouteNavigation,
  getClearCheckoutPaymentErrorSearch,
  getConfirmPaymentRouteNavigation,
  getOrderPlacedRouteNavigation,
} from './checkout-navigation'

describe('checkout navigation helpers', () => {
  it('builds the market checkout path used for redirects', () => {
    expect(
      getCheckoutPath({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
      }),
    ).toBe('/us/en/checkout/cart_123')
  })

  it('builds account login hrefs with an encoded checkout redirect', () => {
    expect(
      getCheckoutAccountLoginHref({
        cartId: 'cart_123',
        country: 'fr',
        locale: 'en',
      }),
    ).toBe('/fr/en/account/login?redirect=%2Ffr%2Fen%2Fcheckout%2Fcart_123')
  })

  it('builds the search params that clear checkout payment errors', () => {
    expect(getClearCheckoutPaymentErrorSearch()).toEqual({
      payment_error: undefined,
      payment_error_code: undefined,
    })
  })

  it('builds a checkout route navigation descriptor', () => {
    expect(
      getCheckoutRouteNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
      }),
    ).toEqual({
      params: {
        country: 'us',
        id: 'cart_123',
        locale: 'en',
      },
      replace: true,
      search: {
        payment_error: undefined,
        payment_error_code: undefined,
      },
      to: '/$country/$locale/checkout/$id',
    })
  })

  it('builds a confirm-payment route navigation descriptor', () => {
    expect(
      getConfirmPaymentRouteNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
      }),
    ).toEqual({
      params: {
        country: 'us',
        id: 'cart_123',
        locale: 'en',
      },
      replace: true,
      search: {
        session: undefined,
      },
      to: '/$country/$locale/confirm-payment/$id',
    })
  })

  it('builds an order placed route navigation descriptor', () => {
    expect(
      getOrderPlacedRouteNavigation({
        country: 'us',
        locale: 'en',
        orderId: 'R123456789',
      }),
    ).toEqual({
      params: {
        country: 'us',
        id: 'R123456789',
        locale: 'en',
      },
      replace: true,
      to: '/$country/$locale/order-placed/$id',
    })
  })
})
