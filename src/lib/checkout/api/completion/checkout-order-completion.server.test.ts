import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'
import {
  confirmCheckoutPaymentAndCompleteOrderOnServer,
  completeCheckoutOrderOnServer,
} from './checkout-order-completion.server'
import {
  ensureCheckoutShippingRateForPayment,
  readCheckoutOrderState,
} from '../checkout-order-state.server'
import { completeCheckoutPaymentSessionResourceOnServer } from '../payment/checkout-payment.server'

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))

vi.mock('./checkout-completion.server', () => ({
  recoverCheckoutCompletionResult: vi.fn(async ({ lookupCompletedOrder }) => {
    await lookupCompletedOrder()

    return {
      error: 'Recovered completion error',
      success: false,
    }
  }),
  toCompletedCheckoutOrderResult: vi.fn(({ order }) => ({
    order,
    success: true,
  })),
  toCompletedCheckoutResourceResult: vi.fn(({ order }) => ({
    order,
    success: true,
  })),
}))

vi.mock('../checkout-order-state.server', () => ({
  ensureCheckoutShippingRateForPayment: vi.fn(),
  readCheckoutOrderState: vi.fn(),
}))

vi.mock('../payment/checkout-payment.server', () => ({
  completeCheckoutPaymentSessionResourceOnServer: vi.fn(),
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: vi.fn(() => ({
    spreeToken: 'cart-token',
  })),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_123',
}

const selectedShippingRate = {
  displayPrice: { amount: 5, currencyCode: 'USD' },
  fulfillmentId: 'fulfillment_123',
  id: 'rate_123',
  name: 'Standard shipping',
  price: { amount: 5, currencyCode: 'USD' },
  selected: true,
}

function setSpreeClient({
  completeOrder = { completed_at: '2026-07-11T00:00:00Z', id: 'or_123' },
}: {
  completeOrder?: unknown
} = {}) {
  const complete = vi.fn(async () => completeOrder)
  const getOrder = vi.fn(async () => completeOrder)

  vi.mocked(getServerSpreeClientForMarket).mockReturnValue({
    carts: {
      complete,
    },
    orders: {
      get: getOrder,
    },
  } as never)

  return { complete, getOrder }
}

function checkoutOrder(currentStep = 'payment') {
  return {
    currentStep,
    id: 'cart_123',
    shippingRates: [selectedShippingRate],
  }
}

describe('checkout order completion server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readCheckoutOrderState).mockResolvedValue(
      checkoutOrder() as never,
    )
    vi.mocked(ensureCheckoutShippingRateForPayment).mockResolvedValue(
      checkoutOrder() as never,
    )
    vi.mocked(completeCheckoutPaymentSessionResourceOnServer).mockResolvedValue(
      {
        id: 'ps_123',
        status: 'completed',
      } as never,
    )
  })

  it('completes the order and normalizes the completed resource', async () => {
    const { complete } = setSpreeClient()

    await expect(
      completeCheckoutOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        selectedShippingRate,
      }),
    ).resolves.toEqual({
      order: {
        completed_at: '2026-07-11T00:00:00Z',
        id: 'or_123',
      },
      success: true,
    })

    expect(complete).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'cart-token',
    })
    expect(toCompletedCheckoutResourceResult).toHaveBeenCalledWith({
      fallbackToken: 'cart-token',
      order: { completed_at: '2026-07-11T00:00:00Z', id: 'or_123' },
      orderIds: ['cart_123'],
    })
  })

  it('confirms a payment session before completing the order', async () => {
    const { complete } = setSpreeClient()

    await expect(
      confirmCheckoutPaymentAndCompleteOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        sessionId: 'ps_123',
        sessionResult: 'session-result',
      }),
    ).resolves.toEqual({
      order: {
        completed_at: '2026-07-11T00:00:00Z',
        id: 'or_123',
      },
      success: true,
    })

    expect(completeCheckoutPaymentSessionResourceOnServer).toHaveBeenCalledWith(
      {
        cartId: 'cart_123',
        client: expect.anything(),
        errorFallback: 'Failed to confirm payment. Please try again.',
        payload: { session_result: 'session-result' },
        requestOptions: { spreeToken: 'cart-token' },
        sessionId: 'ps_123',
      },
    )
    expect(complete).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'cart-token',
    })
  })

  it('returns a payment failure without completing the order', async () => {
    const { complete } = setSpreeClient()
    vi.mocked(completeCheckoutPaymentSessionResourceOnServer).mockResolvedValue(
      {
        id: 'ps_123',
        status: 'failed',
      } as never,
    )

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
    expect(complete).not.toHaveBeenCalled()
  })

  it('recovers order completion errors through the existing completion policy', async () => {
    const { complete, getOrder } = setSpreeClient()
    complete.mockRejectedValueOnce(new Error('Order already completed'))

    await expect(
      completeCheckoutOrderOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        selectedShippingRate,
      }),
    ).resolves.toEqual({
      error: 'Recovered completion error',
      success: false,
    })
    expect(getOrder).toHaveBeenCalledWith('cart_123', undefined, {
      spreeToken: 'cart-token',
    })
    expect(recoverCheckoutCompletionResult).toHaveBeenCalled()
  })
})
