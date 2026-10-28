// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCheckoutPaymentSessionOnServer } from './checkout-payment-session.server'
import { paymentSessionResource } from '../../utils/payment/payment-session-response.test-support'

const server = vi.hoisted(() => ({
  buildReturnUrl: vi.fn(),
  getClient: vi.fn(),
  getPaymentOptions: vi.fn(),
  getRequestOptions: vi.fn(),
  mapPaymentSession: vi.fn(),
  requirePaymentMethod: vi.fn(),
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreePaymentSession: server.mapPaymentSession,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getClient,
}))

vi.mock('@/lib/checkout/utils/payment/payment-return-url.server', () => ({
  buildServerCheckoutPaymentReturnUrl: server.buildReturnUrl,
}))

vi.mock('./checkout-payment-validation.server', () => ({
  getCheckoutPaymentRequestOptions: server.getPaymentOptions,
  requireCheckoutPaymentMethod: server.requirePaymentMethod,
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getRequestOptions,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const client = {
  carts: {
    paymentSessions: {
      create: vi.fn(),
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  server.getClient.mockReturnValue(client)
  server.getPaymentOptions.mockResolvedValue({ spreeToken: 'cart-token' })
  server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
  server.requirePaymentMethod.mockResolvedValue({ cartToken: 'cart-token' })
  server.buildReturnUrl.mockReturnValue(
    'http://localhost:3002/us/en/confirm-payment/cart_123',
  )
  client.carts.paymentSessions.create.mockResolvedValue(
    paymentSessionResource({ currency: 'EUR' }),
  )
})

describe('checkout payment-session market ownership', () => {
  it('rejects a create response from another market before mapping provider data', async () => {
    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }),
    ).rejects.toThrow('different market')

    expect(server.mapPaymentSession).not.toHaveBeenCalled()
  })

  it('allows a create response with the resolved market currency', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce(
      paymentSessionResource({ currency: 'usd' }),
    )
    server.mapPaymentSession.mockReturnValue({
      id: 'ps_123',
      status: 'processing',
    })

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }),
    ).resolves.toEqual({ id: 'ps_123', status: 'processing' })

    expect(server.mapPaymentSession).toHaveBeenCalledOnce()
  })

  it('passes an associated cart token into payment-method preparation', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce(
      paymentSessionResource(),
    )
    server.getPaymentOptions.mockResolvedValue({
      spreeToken: 'associated-cart-token',
    })
    server.mapPaymentSession.mockReturnValue({
      id: 'ps_123',
      status: 'processing',
    })

    await createCheckoutPaymentSessionOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      paymentMethodId: 'pm_123',
      selectedShippingRate: undefined,
    })

    expect(server.requirePaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        cartToken: 'associated-cart-token',
        expectedCurrentCartToken: 'associated-cart-token',
      }),
    )
  })

  it('preserves the customer token through payment preparation and creation', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce(
      paymentSessionResource({ currency: 'USD' }),
    )
    server.getPaymentOptions.mockResolvedValue({
      spreeToken: 'associated-cart-token',
      token: 'refreshed-customer-token',
    })
    server.getRequestOptions.mockImplementation(
      (cartToken?: string, customerToken?: string) => ({
        ...(cartToken ? { spreeToken: cartToken } : {}),
        ...(customerToken ? { token: customerToken } : {}),
      }),
    )
    server.requirePaymentMethod.mockResolvedValue({
      cartToken: 'rotated-cart-token',
    })
    server.mapPaymentSession.mockReturnValue({
      id: 'ps_123',
      status: 'processing',
    })

    await createCheckoutPaymentSessionOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      paymentMethodId: 'pm_123',
      selectedShippingRate: undefined,
    })

    expect(server.requirePaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        customerToken: 'refreshed-customer-token',
      }),
    )
    expect(server.getRequestOptions).toHaveBeenLastCalledWith(
      'rotated-cart-token',
      'refreshed-customer-token',
    )
    expect(client.carts.paymentSessions.create).toHaveBeenCalledWith(
      'cart_123',
      expect.any(Object),
      {
        spreeToken: 'rotated-cart-token',
        token: 'refreshed-customer-token',
      },
    )
  })

  it('rejects a create response without a payment-session resource identity', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce({
      currency: 'USD',
      status: 'processing',
    })

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }),
    ).rejects.toThrow('payment session')

    expect(server.mapPaymentSession).not.toHaveBeenCalled()
  })

  it('rejects a create response for another payment method before mapping', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce(
      paymentSessionResource({ payment_method_id: 'pm_other' }),
    )

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }),
    ).rejects.toThrow('does not match the requested payment method')

    expect(server.mapPaymentSession).not.toHaveBeenCalled()
  })

  it('rejects a create response belonging to another cart', async () => {
    client.carts.paymentSessions.create.mockResolvedValueOnce(
      paymentSessionResource({ cart_id: 'cart_other', order_id: 'or_other' }),
    )

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate: undefined,
      }),
    ).rejects.toThrow('does not match the requested cart')

    expect(server.mapPaymentSession).not.toHaveBeenCalled()
  })
})
