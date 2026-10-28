// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { getConfirmPaymentRouteNavigation } from './checkout-navigation'

describe('checkout payment recovery navigation', () => {
  it('puts the completed payment-session identity in the confirm route', () => {
    expect(
      getConfirmPaymentRouteNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        sessionId: 'ps_123',
      }),
    ).toMatchObject({
      search: { session: 'ps_123' },
      to: '/$country/$locale/confirm-payment/$id',
    })
  })
})
