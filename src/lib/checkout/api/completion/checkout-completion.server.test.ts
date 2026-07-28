import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutOrderResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'
import { clearCartCookies } from '@/lib/cookies/cart-cookie.server'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import {
  persistCompletedOrderAccess,
  persistCompletedOrderResourceAccess,
} from '../checkout-session.server'

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: vi.fn(),
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: vi.fn((order: { id: string }) => ({
    currentStep: 'complete',
    id: order.id,
  })),
}))

vi.mock('../checkout-session.server', () => ({
  persistCompletedOrderAccess: vi.fn(),
  persistCompletedOrderResourceAccess: vi.fn(),
}))

type CompletedCheckoutResource = Parameters<
  typeof toCompletedCheckoutResourceResult
>[0]['order']

const completedOrder = {
  completed_at: '2026-07-08T10:00:00Z',
  id: 'cart_123',
} as CompletedCheckoutResource

function recoverableError(message = 'Order already completed') {
  return Object.assign(new Error(message), {
    status: 422,
  })
}

describe('checkout completion server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists access and clears the active cart for mapped completed orders', () => {
    const order = {
      currentStep: 'complete',
      id: 'cart_123',
    } as CheckoutOrder

    expect(
      toCompletedCheckoutOrderResult({
        order,
        orderIds: ['cart_123', 'order_123'],
        orderToken: 'cart-token',
      }),
    ).toEqual({
      order,
      success: true,
    })
    expect(persistCompletedOrderAccess).toHaveBeenCalledWith({
      orderIds: ['cart_123', 'order_123'],
      orderToken: 'cart-token',
    })
    expect(clearCartCookies).toHaveBeenCalledTimes(1)
  })

  it('persists resource access and maps completed order resources', () => {
    expect(
      toCompletedCheckoutResourceResult({
        fallbackToken: 'cart-token',
        order: completedOrder,
        orderIds: ['cart_123'],
      }),
    ).toEqual({
      order: {
        currentStep: 'complete',
        id: 'cart_123',
      },
      success: true,
    })
    expect(persistCompletedOrderResourceAccess).toHaveBeenCalledWith({
      fallbackToken: 'cart-token',
      order: completedOrder,
      orderIds: ['cart_123'],
    })
    expect(mapSpreeCheckoutToOrder).toHaveBeenCalledWith(completedOrder)
    expect(clearCartCookies).toHaveBeenCalledTimes(1)
  })

  it('recovers successful completion when Spree returns a recoverable status', async () => {
    await expect(
      recoverCheckoutCompletionResult({
        error: recoverableError(),
        errorCode: 'order_complete_failed',
        fallbackMessage: 'Failed to complete order.',
        fallbackToken: 'cart-token',
        lookupCompletedOrder: async () => completedOrder,
        orderIds: ['cart_123'],
      }),
    ).resolves.toEqual({
      order: {
        currentStep: 'complete',
        id: 'cart_123',
      },
      success: true,
    })
    expect(persistCompletedOrderResourceAccess).toHaveBeenCalledWith({
      fallbackToken: 'cart-token',
      order: completedOrder,
      orderIds: ['cart_123'],
    })
    expect(clearCartCookies).toHaveBeenCalledTimes(1)
  })

  it('returns a failure without lookup for non-recoverable completion errors', async () => {
    const lookupCompletedOrder = vi.fn(
      async (): Promise<CompletedCheckoutResource | null> => completedOrder,
    )

    await expect(
      recoverCheckoutCompletionResult({
        error: Object.assign(new Error('Gateway failed'), {
          status: 500,
        }),
        errorCode: 'payment_confirmation_failed',
        fallbackMessage: 'Failed to confirm payment. Please try again.',
        lookupCompletedOrder,
        orderIds: ['cart_123'],
      }),
    ).resolves.toEqual({
      error: 'Gateway failed',
      errorCode: 'payment_confirmation_failed',
      success: false,
    })
    expect(lookupCompletedOrder).not.toHaveBeenCalled()
    expect(clearCartCookies).not.toHaveBeenCalled()
  })
})
