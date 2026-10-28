// @vitest-environment node

import type { Client } from '@spree/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  completeCheckoutPaymentSessionOnServer,
  completeCheckoutPaymentSessionResourceOnServer,
} from './checkout-payment-session.server'
import { paymentSessionResource } from '../../utils/payment/payment-session-response.test-support'

const server = vi.hoisted(() => ({
  ensureCheckoutShippingRateForPaymentWithToken: vi.fn(),
  getCheckoutCartRequestOptions: vi.fn(),
  getServerSpreeClientForMarket: vi.fn(),
}))

vi.mock('../checkout-order-state.server', () => ({
  ensureCheckoutShippingRateForPaymentWithToken:
    server.ensureCheckoutShippingRateForPaymentWithToken,
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getCheckoutCartRequestOptions,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

describe('checkout payment-session server boundary', () => {
  const market = {
    country: 'us',
    currencyCode: 'USD',
    locale: 'en',
    marketId: 'market-us',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    server.ensureCheckoutShippingRateForPaymentWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: { paymentMethods: [] },
    })
    server.getCheckoutCartRequestOptions.mockReturnValue({
      spreeToken: 'cart-token',
    })
  })

  it('does not complete a payment session after the checkout becomes inactive', async () => {
    const complete = vi.fn()
    server.ensureCheckoutShippingRateForPaymentWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.getServerSpreeClientForMarket.mockReturnValue({
      carts: {
        paymentSessions: { complete },
      },
    })

    await expect(
      completeCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        selectedShippingRate: undefined,
        sessionId: 'ps_123',
      }),
    ).rejects.toThrow('Checkout order is not available.')

    expect(complete).not.toHaveBeenCalled()
  })

  it('completes a payment session with the token returned by shipping refresh', async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(paymentSessionResource({ status: 'completed' }))
    const client = {
      carts: {
        paymentSessions: { complete },
      },
    } as unknown as Client

    server.ensureCheckoutShippingRateForPaymentWithToken.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      checkoutOrder: { paymentMethods: [] },
    })
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken,
      }),
    )

    await completeCheckoutPaymentSessionOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      selectedShippingRate: undefined,
      sessionId: 'ps_123',
    })

    expect(server.getCheckoutCartRequestOptions).toHaveBeenLastCalledWith(
      'rotated-cart-token',
    )
    expect(complete).toHaveBeenCalledWith('cart_123', 'ps_123', undefined, {
      spreeToken: 'rotated-cart-token',
    })
  })

  it('preserves Spree status and code while returning a safe error message', async () => {
    const spreeError = Object.assign(new Error('state conflict'), {
      code: 'cart_already_updated',
      status: 409,
    })
    const complete = vi.fn().mockRejectedValue(spreeError)
    const client = {
      carts: {
        paymentSessions: {
          complete,
        },
      },
    } as unknown as Client

    await expect(
      completeCheckoutPaymentSessionResourceOnServer({
        cartId: 'cart_123',
        client,
        errorFallback: 'Payment confirmation failed.',
        market,
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'ps_123',
      }),
    ).rejects.toMatchObject({
      message: 'state conflict',
      code: 'cart_already_updated',
      status: 409,
    })
    expect(complete).toHaveBeenCalledOnce()
  })

  it('rejects a completed session from another market before mapping it', async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(
        paymentSessionResource({ currency: 'EUR', status: 'completed' }),
      )
    const client = {
      carts: {
        paymentSessions: {
          complete,
        },
      },
    } as unknown as Client

    await expect(
      completeCheckoutPaymentSessionResourceOnServer({
        cartId: 'cart_123',
        client,
        market,
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'ps_123',
      }),
    ).rejects.toThrow('different market')
  })

  it('rejects a completion response for another payment session', async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(
        paymentSessionResource({ id: 'ps_other', status: 'completed' }),
      )
    const client = {
      carts: {
        paymentSessions: {
          complete,
        },
      },
    } as unknown as Client

    await expect(
      completeCheckoutPaymentSessionResourceOnServer({
        cartId: 'cart_123',
        client,
        market,
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'ps_current',
      }),
    ).rejects.toThrow('does not match the requested session')
  })

  it('accepts a completion response looked up by provider external id', async () => {
    const complete = vi.fn().mockResolvedValue(
      paymentSessionResource({
        external_id: 'adyen-session',
        id: 'ps_current',
        status: 'completed',
      }),
    )
    const client = {
      carts: {
        paymentSessions: {
          complete,
        },
      },
    } as unknown as Client

    await expect(
      completeCheckoutPaymentSessionResourceOnServer({
        cartId: 'cart_123',
        client,
        market,
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'adyen-session',
      }),
    ).resolves.toMatchObject({
      id: 'ps_current',
      status: 'completed',
    })

    expect(complete).toHaveBeenCalledWith(
      'cart_123',
      'adyen-session',
      undefined,
      { spreeToken: 'cart-token' },
    )
  })

  it('rejects a completion response belonging to another cart', async () => {
    const complete = vi.fn().mockResolvedValue(
      paymentSessionResource({
        cart_id: 'cart_other',
        order_id: 'or_other',
        status: 'completed',
      }),
    )
    const client = {
      carts: {
        paymentSessions: {
          complete,
        },
      },
    } as unknown as Client

    await expect(
      completeCheckoutPaymentSessionResourceOnServer({
        cartId: 'cart_123',
        client,
        market,
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'ps_123',
      }),
    ).rejects.toThrow('does not match the requested cart')
  })
})
