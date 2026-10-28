// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { CheckoutCompletionResult } from '@/lib/checkout/utils/completion/checkout-completion-contract'

import { confirmCheckoutPaymentAndCompleteOrderOnServer } from './checkout-payment-confirmation.server'

const server = vi.hoisted(() => ({
  assertCartMarket: vi.fn(),
  completeOrder: vi.fn(),
  completePaymentSession: vi.fn(),
  ensureShippingRate: vi.fn(),
  getClient: vi.fn(),
  getCompletedOrderAccessToken: vi.fn(),
  getRequestOptions: vi.fn(),
  readOrderStateWithToken: vi.fn(),
  recoverCompletion: vi.fn(),
  toCompletedOrderResult: vi.fn(),
  toCompletedResourceResult: vi.fn(),
}))

vi.mock('@/lib/cart/utils/cart-market', () => ({
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
}))

vi.mock('@/lib/checkout/api/checkout-order-state.server', () => ({
  ensureCheckoutShippingRateForPaymentWithToken: server.ensureShippingRate,
  readCheckoutOrderStateWithToken: server.readOrderStateWithToken,
}))

vi.mock('@/lib/checkout/api/payment/checkout-payment.server', () => ({
  completeCheckoutPaymentSessionResourceOnServer: server.completePaymentSession,
}))

vi.mock('@/lib/checkout/api/checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getRequestOptions,
}))

vi.mock('@/lib/checkout/api/completion/checkout-completion.server', () => ({
  recoverCheckoutCompletionResult: server.recoverCompletion,
  toCompletedCheckoutOrderResult: server.toCompletedOrderResult,
  toCompletedCheckoutResourceResult: server.toCompletedResourceResult,
}))

vi.mock('@/lib/checkout/api/completion/checkout-order-complete.server', () => ({
  completeCheckoutOrderResourceOnServer: server.completeOrder,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getClient,
}))

vi.mock('@/lib/cookies/completed-order-cookie.server', () => ({
  getCompletedOrderAccessToken: server.getCompletedOrderAccessToken,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const completedOrder = {
  completedAt: '2026-06-16T11:30:00Z',
  currentStep: null,
  id: 'cart_123',
  orderResourceId: 'or_123',
} as unknown as CheckoutOrder

const completedResult: CheckoutCompletionResult = {
  order: completedOrder,
  success: true,
}

afterEach(() => {
  vi.clearAllMocks()
  server.getCompletedOrderAccessToken.mockReturnValue(undefined)
})

describe('confirm payment completion recovery', () => {
  it('does not continue payment after the checkout becomes inactive', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to confirm payment. Please try again.',
      order: null,
      success: false,
    }
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.recoverCompletion.mockReturnValue(recoveryResult)

    const result = await confirmCheckoutPaymentAndCompleteOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      sessionId: 'ps_123',
    })

    expect(result).toBe(recoveryResult)
    expect(server.completePaymentSession).not.toHaveBeenCalled()
    expect(server.completeOrder).not.toHaveBeenCalled()
    expect(server.recoverCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        cartId: 'cart_123',
        error: { code: 'completion_in_progress', status: 409 },
      }),
    )
  })

  it('recovers a completed order with its access token after the cart cookie is gone', async () => {
    const completedOrderResource = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    const client = {
      orders: {
        get: vi
          .fn()
          .mockRejectedValueOnce(new Error('cart cookie was cleared'))
          .mockResolvedValueOnce(completedOrderResource),
      },
    }
    server.getCompletedOrderAccessToken.mockReturnValue('completed-order-token')
    server.getClient.mockReturnValue(client)
    server.getRequestOptions.mockReturnValue({})
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: undefined,
      checkoutOrder: null,
    })
    server.assertCartMarket.mockImplementation(() => undefined)
    server.toCompletedResourceResult.mockReturnValue(completedResult)

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toBe(completedResult)

    expect(client.orders.get).toHaveBeenNthCalledWith(
      2,
      'cart_123',
      undefined,
      { spreeToken: 'completed-order-token' },
    )
    expect(server.toCompletedResourceResult).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackToken: undefined,
        order: completedOrderResource,
      }),
    )
    expect(server.completePaymentSession).not.toHaveBeenCalled()
    expect(server.completeOrder).not.toHaveBeenCalled()
  })

  it('passes a rotated read token into payment preparation', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to confirm payment. Please try again.',
      order: null,
      success: false,
    }
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      checkoutOrder: activeOrder,
    })
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      checkoutOrder: null,
    })
    server.recoverCompletion.mockReturnValue(recoveryResult)

    const result = await confirmCheckoutPaymentAndCompleteOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      sessionId: 'ps_123',
    })

    expect(result).toBe(recoveryResult)
    expect(server.ensureShippingRate).toHaveBeenCalledWith(
      expect.objectContaining({
        cartId: 'cart_123',
        cartToken: 'rotated-cart-token',
        expectedCurrentCartToken: 'rotated-cart-token',
      }),
    )
  })

  it('uses the latest token observed before payment preparation fails', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    const preparationError = Object.assign(
      new Error('checkout is being completed'),
      {
        code: 'completion_in_progress',
        status: 409,
      },
    )
    const recoveryResult: CheckoutCompletionResult = {
      error: 'Failed to confirm payment. Please try again.',
      order: null,
      success: false,
    }
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
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

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toBe(recoveryResult)

    expect(server.recoverCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackToken: 'rotated-cart-token',
      }),
    )
  })

  it('accepts an already-completed order returned through the order serializer', async () => {
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: completedOrder,
    })
    server.toCompletedOrderResult.mockReturnValue(completedResult)

    const result = await confirmCheckoutPaymentAndCompleteOrderOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      sessionId: 'ps_123',
    })

    expect(result).toBe(completedResult)
    expect(server.toCompletedOrderResult).toHaveBeenCalledWith({
      cartId: 'cart_123',
      expectedCurrentAccessToken: null,
      expectedCurrentCartToken: 'cart-token',
      order: completedOrder,
      orderIds: ['cart_123', 'or_123'],
      orderToken: 'cart-token',
    })
    expect(server.completePaymentSession).not.toHaveBeenCalled()
    expect(server.completeOrder).not.toHaveBeenCalled()
    expect(server.ensureShippingRate).not.toHaveBeenCalled()
  })

  it('does not complete an active checkout without payment return data', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder

    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    ).resolves.toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })

    expect(server.ensureShippingRate).not.toHaveBeenCalled()
    expect(server.completePaymentSession).not.toHaveBeenCalled()
    expect(server.completeOrder).not.toHaveBeenCalled()
  })

  it('does not recover a direct completion projection failure', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    const projectionError = new Error('malformed completed order')

    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
    server.completePaymentSession.mockResolvedValue({
      id: 'ps_123',
      status: 'completed',
    })
    server.completeOrder.mockResolvedValue({ id: 'or_123' })
    server.toCompletedResourceResult.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).rejects.toBe(projectionError)

    expect(server.recoverCompletion).not.toHaveBeenCalled()
  })

  it('checks the market before projecting a completed-order fallback', async () => {
    const completedOrderResource = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    const client = {
      orders: {
        get: vi.fn().mockResolvedValue(completedOrderResource),
      },
    }
    server.getClient.mockReturnValue(client)
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
    server.toCompletedResourceResult.mockReturnValue(completedResult)

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toBe(completedResult)

    expect(server.toCompletedResourceResult).toHaveBeenCalledWith({
      cartId: 'cart_123',
      expectedCurrentAccessToken: null,
      expectedCurrentCartToken: 'cart-token',
      fallbackToken: 'cart-token',
      market,
      order: completedOrderResource,
      orderIds: ['cart_123'],
    })

    expect(server.assertCartMarket).toHaveBeenCalledWith(
      completedOrderResource,
      market,
    )
    expect(server.toCompletedOrderResult).not.toHaveBeenCalled()
  })

  it('guards a completed payment-preparation result with the request access snapshot', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'rotated-cart-token',
      persistedCartToken: 'rotated-cart-token',
      checkoutOrder: completedOrder,
    })
    server.toCompletedOrderResult.mockReturnValue(completedResult)

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toBe(completedResult)

    expect(server.toCompletedOrderResult).toHaveBeenCalledWith({
      cartId: 'cart_123',
      expectedCurrentAccessToken: null,
      expectedCurrentCartToken: 'rotated-cart-token',
      order: completedOrder,
      orderIds: ['cart_123', 'or_123'],
      orderToken: 'rotated-cart-token',
    })
  })

  it('does not project an incomplete order fallback', async () => {
    const incompleteOrderResource = {
      completed_at: null,
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    const client = {
      orders: {
        get: vi.fn().mockResolvedValue(incompleteOrderResource),
      },
    }
    server.getClient.mockReturnValue(client)
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })

    expect(server.assertCartMarket).toHaveBeenCalledWith(
      incompleteOrderResource,
      market,
    )
    expect(server.toCompletedOrderResult).not.toHaveBeenCalled()
  })

  it('does not project an order fallback with another requested identity', async () => {
    const client = {
      orders: {
        get: vi.fn().mockResolvedValue({
          completed_at: '2026-06-16T11:30:00Z',
          currency: 'USD',
          id: 'or_other',
          market_id: 'market-us',
        }),
      },
    }
    server.getClient.mockReturnValue(client)
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: null,
    })
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'or_requested',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })

    expect(server.assertCartMarket).not.toHaveBeenCalled()
    expect(server.toCompletedOrderResult).not.toHaveBeenCalled()
  })

  it('does not complete an order when payment-session completion is not terminally successful', async () => {
    const activeOrder = {
      completedAt: null,
      currentStep: 'payment',
      id: 'cart_123',
      shippingRates: [],
    } as unknown as CheckoutOrder
    server.readOrderStateWithToken.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.ensureShippingRate.mockResolvedValue({
      cartToken: 'cart-token',
      checkoutOrder: activeOrder,
    })
    server.getRequestOptions.mockReturnValue({ spreeToken: 'cart-token' })
    server.completePaymentSession.mockResolvedValue({
      id: 'ps_123',
      status: 'expired',
    })

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
      }),
    ).resolves.toEqual({
      error: 'Payment was not successful. Please try again.',
      errorCode: 'payment_failed',
      success: false,
    })

    expect(server.completeOrder).not.toHaveBeenCalled()
  })
})
