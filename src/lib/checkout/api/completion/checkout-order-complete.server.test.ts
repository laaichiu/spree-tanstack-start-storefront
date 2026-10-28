// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutCompletionResult } from '@/lib/checkout/utils/completion/checkout-completion-contract'

import { completeCheckoutOrderOnServer } from './checkout-order-complete.server'

const server = vi.hoisted(() => ({
  ensureShippingRate: vi.fn(),
  getClient: vi.fn(),
  getCompletedOrderAccessToken: vi.fn(),
  getRequestOptions: vi.fn(),
  recoverCompletion: vi.fn(),
  toCompletedResource: vi.fn(),
}))

vi.mock('../checkout-order-state.server', () => ({
  ensureCheckoutShippingRateForPaymentWithToken: server.ensureShippingRate,
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getRequestOptions,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getClient,
}))

vi.mock('@/lib/cookies/completed-order-cookie.server', () => ({
  getCompletedOrderAccessToken: server.getCompletedOrderAccessToken,
}))

vi.mock('./checkout-completion.server', () => ({
  recoverCheckoutCompletionResult: server.recoverCompletion,
  toCompletedCheckoutResourceResult: server.toCompletedResource,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const rawCompletedOrder = {
  completed_at: '2026-06-16T11:30:00Z',
  currency: 'USD',
  id: 'or_us',
  market_id: 'market-us',
}

const completedResult: CheckoutCompletionResult = {
  order: null,
  success: true,
}

const client = {
  carts: {
    complete: vi.fn(),
  },
  orders: {
    get: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  server.getCompletedOrderAccessToken.mockReturnValue(undefined)
  server.getRequestOptions.mockImplementation((token?: string) => ({
    spreeToken: token,
  }))
  server.getClient.mockReturnValue(client)
  client.carts.complete.mockReset()
  client.orders.get.mockReset()
})

describe('checkout order completion', () => {
  it('recovers instead of completing after the checkout becomes inactive', async () => {
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to complete order.',
      order: null,
      success: false,
    }
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.recoverCompletion.mockReturnValue(recoveryResult)

    const result = await completeCheckoutOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      selectedShippingRate: undefined,
    })

    expect(result).toBe(recoveryResult)
    expect(client.carts.complete).not.toHaveBeenCalled()
    expect(server.recoverCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        cartId: 'cart_123',
        error: { code: 'completion_in_progress', status: 409 },
      }),
    )
  })

  it('passes the resolved market to the raw completion projection boundary', async () => {
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      persistedCartToken: 'persisted-cart-token',
      checkoutOrder: { id: 'cart_123' },
    })
    client.carts.complete.mockResolvedValue(rawCompletedOrder)
    server.toCompletedResource.mockReturnValue(completedResult)

    const result = await completeCheckoutOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      selectedShippingRate: undefined,
    })

    expect(result).toBe(completedResult)
    expect(client.carts.complete).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'rotated-cart-token',
    })
    expect(server.toCompletedResource).toHaveBeenCalledWith({
      cartId: 'cart_123',
      expectedCurrentAccessToken: null,
      expectedCurrentCartToken: 'persisted-cart-token',
      fallbackToken: 'rotated-cart-token',
      market,
      order: rawCompletedOrder,
      orderIds: ['cart_123'],
    })
  })

  it('does not recover a direct completion projection failure', async () => {
    const projectionError = new Error('malformed completed order')
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      persistedCartToken: 'persisted-cart-token',
      checkoutOrder: { id: 'cart_123' },
    })
    client.carts.complete.mockResolvedValue(rawCompletedOrder)
    server.toCompletedResource.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      completeCheckoutOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        selectedShippingRate: undefined,
      }),
    ).rejects.toBe(projectionError)

    expect(server.recoverCompletion).not.toHaveBeenCalled()
  })

  it('uses the latest token observed before shipping preparation fails', async () => {
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to complete order.',
      order: null,
      success: false,
    }
    const preparationError = Object.assign(
      new Error('checkout is being completed'),
      {
        code: 'completion_in_progress',
        status: 409,
      },
    )
    server.ensureShippingRate.mockImplementationOnce(
      async ({
        onCartTokenAvailable,
      }: {
        onCartTokenAvailable?: (token: string) => void
      }) => {
        onCartTokenAvailable?.('rotated-cart-token')
        throw preparationError
      },
    )
    server.recoverCompletion.mockReturnValue(recoveryResult)
    client.orders.get.mockResolvedValue(rawCompletedOrder)

    const result = await completeCheckoutOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      selectedShippingRate: undefined,
    })

    expect(result).toBe(recoveryResult)

    const recoveryInput = server.recoverCompletion.mock.calls[0][0]
    await recoveryInput.lookupCompletedOrder()

    expect(client.orders.get).toHaveBeenCalledWith('cart_123', undefined, {
      spreeToken: 'rotated-cart-token',
    })
    expect(server.recoverCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackToken: 'rotated-cart-token',
      }),
    )
  })

  it('keeps completed-order access available to completion recovery', async () => {
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to complete order.',
      order: null,
      success: false,
    }
    server.getCompletedOrderAccessToken.mockReturnValue('completed-order-token')
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: { id: 'cart_123' },
    })
    client.carts.complete.mockRejectedValue({
      code: 'completion_in_progress',
      status: 409,
    })
    server.recoverCompletion.mockReturnValue(recoveryResult)
    client.orders.get
      .mockRejectedValueOnce(new Error('cart lookup unavailable'))
      .mockResolvedValueOnce(rawCompletedOrder)

    await expect(
      completeCheckoutOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        selectedShippingRate: undefined,
      }),
    ).resolves.toBe(recoveryResult)

    const recoveryInput = server.recoverCompletion.mock.calls[0][0]

    await expect(recoveryInput.lookupCompletedOrder()).resolves.toBe(
      rawCompletedOrder,
    )

    expect(client.orders.get).toHaveBeenNthCalledWith(
      2,
      'cart_123',
      undefined,
      { spreeToken: 'completed-order-token' },
    )
  })
})
