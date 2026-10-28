// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'

const server = vi.hoisted(() => ({
  clearCheckoutCartCookiesIfOwnedByCart: vi.fn(),
  mapSpreeCheckoutToOrder: vi.fn(),
  mapSpreeOrderGroupToCheckoutOrder: vi.fn(),
  persistCompletedOrderGroupResourceAccess: vi.fn(),
  persistCompletedOrderResourceAccess: vi.fn(),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookies: vi.fn(),
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapSpreeCheckoutToOrder,
  mapSpreeOrderGroupToCheckoutOrder: server.mapSpreeOrderGroupToCheckoutOrder,
}))

vi.mock('./../checkout-session.server', () => ({
  clearCheckoutCartCookiesIfOwnedByCart:
    server.clearCheckoutCartCookiesIfOwnedByCart,
  persistCompletedOrderResourceAccess:
    server.persistCompletedOrderResourceAccess,
  persistCompletedOrderGroupResourceAccess:
    server.persistCompletedOrderGroupResourceAccess,
}))

describe('checkout completion recovery', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('looks up the completed order for an explicit 409 completion conflict', async () => {
    const lookupCompletedOrder = vi.fn().mockResolvedValue(null)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'completion_in_progress',
        status: 409,
      },
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(lookupCompletedOrder).toHaveBeenCalledOnce()
    expect(result).toEqual({
      error: 'Failed to complete order.',
      errorCode: 'order_complete_failed',
      order: null,
      success: false,
    })
  })

  it('keeps the original safe error when completed-order recovery lookup fails', async () => {
    const lookupCompletedOrder = vi
      .fn()
      .mockRejectedValue(new Error('completed-order lookup unavailable'))

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'completion_in_progress',
        status: 409,
      },
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(result).toEqual({
      error: 'Failed to complete order.',
      errorCode: 'order_complete_failed',
      order: null,
      success: false,
    })
  })

  it('accepts the completed order found after a 409 cart lock conflict', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    const mappedOrder = { id: 'or_123' }
    const lookupCompletedOrder = vi.fn().mockResolvedValue(completedOrder)
    server.mapSpreeCheckoutToOrder.mockReturnValue(mappedOrder)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      fallbackToken: 'cart-token',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
      expectedCurrentCartToken: 'current-cart-token',
    })

    expect(result).toEqual({
      order: mappedOrder,
      success: true,
    })
    expect(server.persistCompletedOrderResourceAccess).toHaveBeenCalledWith({
      fallbackToken: 'cart-token',
      order: completedOrder,
      orderIds: ['cart_123'],
    })
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).toHaveBeenCalledWith(
      'cart_123',
      undefined,
      'current-cart-token',
    )
  })

  it('maps a completed resource before persisting access or clearing the cart', () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    } as unknown as Parameters<
      typeof toCompletedCheckoutResourceResult
    >[0]['order']
    server.mapSpreeCheckoutToOrder.mockImplementationOnce(() => {
      throw new Error('malformed completed order')
    })

    expect(() =>
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        fallbackToken: 'cart-token',
        market,
        order: completedOrder,
        orderIds: ['cart_123'],
      }),
    ).toThrow('malformed completed order')

    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('propagates recovery mapping failures without persisting access', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    server.mapSpreeCheckoutToOrder.mockImplementationOnce(() => {
      throw new Error('malformed completed order')
    })

    await expect(
      recoverCheckoutCompletionResult({
        cartId: 'cart_123',
        error: {
          code: 'cart_already_updated',
          status: 409,
        },
        errorCode: 'payment_confirmation_failed',
        fallbackMessage: 'Failed to confirm payment. Please try again.',
        lookupCompletedOrder: vi.fn().mockResolvedValue(completedOrder),
        market,
        orderIds: ['cart_123'],
      }),
    ).rejects.toThrow('malformed completed order')

    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('does not project an incomplete lookup resource during recovery', async () => {
    const incompleteOrder = {
      completed_at: null,
      id: 'or_123',
    }
    const lookupCompletedOrder = vi.fn().mockResolvedValue(incompleteOrder)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(result).toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })
    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
  })

  it('does not look up completed orders for unrelated 409 errors', async () => {
    const lookupCompletedOrder = vi.fn()

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'validation_failed',
        status: 409,
      },
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(lookupCompletedOrder).not.toHaveBeenCalled()
    expect(result).toEqual({
      error: 'Failed to complete order.',
      errorCode: 'order_complete_failed',
      success: false,
    })
  })

  it('does not project a completed order from another market during recovery', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'EUR',
      id: 'or_eu',
      market_id: 'market-eu',
    }
    const lookupCompletedOrder = vi.fn().mockResolvedValue(completedOrder)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(result).toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })
    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('does not project an order with another requested resource identity', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_other',
      market_id: 'market-us',
    }
    const lookupCompletedOrder = vi.fn().mockResolvedValue(completedOrder)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'or_requested',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      lookupCompletedOrder,
      market,
      orderIds: ['or_requested'],
    })

    expect(result).toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })
    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('keeps cart-handle completion recovery compatible with an order resource', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }
    const mappedOrder = { id: 'or_123' }
    const lookupCompletedOrder = vi.fn().mockResolvedValue(completedOrder)
    server.mapSpreeCheckoutToOrder.mockReturnValue(mappedOrder)

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      fallbackToken: 'cart-token',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(result).toEqual({
      order: mappedOrder,
      success: true,
    })
  })

  it('does not project an incomplete Order resource identity', async () => {
    const lookupCompletedOrder = vi.fn().mockResolvedValue({
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_',
      market_id: 'market-us',
    })

    const result = await recoverCheckoutCompletionResult({
      cartId: 'cart_123',
      error: {
        code: 'cart_already_updated',
        status: 409,
      },
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      lookupCompletedOrder,
      market,
      orderIds: ['cart_123'],
    })

    expect(result).toEqual({
      error: 'Failed to confirm payment. Please try again.',
      errorCode: 'payment_confirmation_failed',
      order: null,
      success: false,
    })
    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
  })

  it('rejects a mismatched completion resource before persistence or mapping', () => {
    const mismatchedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'EUR',
      id: 'or_eu',
      market_id: 'market-eu',
    }

    expect(() =>
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        market,
        order: mismatchedOrder as unknown as Parameters<
          typeof toCompletedCheckoutResourceResult
        >[0]['order'],
        orderIds: ['cart_123'],
      }),
    ).toThrow('This cart belongs to a different market')

    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('does not treat an incomplete completion resource as a successful order', () => {
    const incompleteOrder = {
      completed_at: null,
      currency: 'USD',
      id: 'or_123',
      market_id: 'market-us',
    }

    expect(() =>
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        market,
        order: incompleteOrder as unknown as Parameters<
          typeof toCompletedCheckoutResourceResult
        >[0]['order'],
        orderIds: ['cart_123'],
      }),
    ).toThrow('The checkout completion response is not completed.')

    expect(server.mapSpreeCheckoutToOrder).not.toHaveBeenCalled()
    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('persists every child order when a multi-seller checkout returns a group', () => {
    const completedOrderGroup = {
      ...baseCart,
      fulfillment_status: null,
      payment_status: null,
      completed_at: '2026-09-26T08:00:00Z',
      currency: 'USD',
      id: 'ogrp_multi_seller',
      number: 'R-multi-seller',
      orders: [
        {
          ...baseCart,
          cart_id: null,
          completed_at: '2026-09-26T08:00:00Z',
          currency: 'USD',
          id: 'or_seller_one',
          market_id: 'market-us',
          number: 'R-multi-seller-1',
        },
        {
          ...baseCart,
          cart_id: null,
          completed_at: '2026-09-26T08:00:00Z',
          currency: 'USD',
          id: 'or_seller_two',
          market_id: 'market-us',
          number: 'R-multi-seller-2',
        },
      ],
    } as unknown as Parameters<
      typeof toCompletedCheckoutResourceResult
    >[0]['order']
    const mappedOrder = { id: 'ogrp_multi_seller' }
    server.mapSpreeOrderGroupToCheckoutOrder.mockReturnValue(mappedOrder)

    expect(
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        expectedCurrentAccessToken: null,
        expectedCurrentCartToken: 'current-cart-token',
        fallbackToken: 'cart-token',
        market,
        order: completedOrderGroup,
        orderIds: ['cart_123'],
      }),
    ).toEqual({ order: mappedOrder, success: true })

    expect(
      server.persistCompletedOrderGroupResourceAccess,
    ).toHaveBeenCalledWith({
      cartId: 'cart_123',
      expectedCurrentAccessToken: null,
      fallbackToken: 'cart-token',
      groupId: 'ogrp_multi_seller',
      groupNumber: 'R-multi-seller',
      orderIds: ['or_seller_one', 'or_seller_two'],
    })
    expect(server.persistCompletedOrderResourceAccess).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).toHaveBeenCalledWith(
      'cart_123',
      undefined,
      'current-cart-token',
    )
  })

  it('rejects an order group whose child belongs to another cart', () => {
    const completedOrderGroup = {
      ...baseCart,
      fulfillment_status: null,
      payment_status: null,
      completed_at: '2026-09-26T08:00:00Z',
      currency: 'USD',
      id: 'ogrp_multi_seller',
      number: 'R-multi-seller',
      orders: [
        {
          ...baseCart,
          cart_id: 'cart_other',
          completed_at: '2026-09-26T08:00:00Z',
          currency: 'USD',
          id: 'or_seller_one',
          market_id: 'market-us',
          number: 'R-multi-seller-1',
        },
      ],
    } as unknown as Parameters<
      typeof toCompletedCheckoutResourceResult
    >[0]['order']

    expect(() =>
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        market,
        order: completedOrderGroup,
        orderIds: ['cart_123'],
      }),
    ).toThrow('does not match the requested cart')

    expect(
      server.persistCompletedOrderGroupResourceAccess,
    ).not.toHaveBeenCalled()
    expect(server.clearCheckoutCartCookiesIfOwnedByCart).not.toHaveBeenCalled()
  })

  it('rejects an order group with a child outside its numbered group', () => {
    const completedOrderGroup = {
      ...baseCart,
      fulfillment_status: null,
      payment_status: null,
      completed_at: '2026-09-26T08:00:00Z',
      currency: 'USD',
      id: 'ogrp_multi_seller',
      number: 'R-multi-seller',
      orders: [
        {
          ...baseCart,
          cart_id: null,
          completed_at: '2026-09-26T08:00:00Z',
          currency: 'USD',
          id: 'or_other',
          market_id: 'market-us',
          number: 'R-OTHER-1',
        },
      ],
    } as unknown as Parameters<
      typeof toCompletedCheckoutResourceResult
    >[0]['order']

    expect(() =>
      toCompletedCheckoutResourceResult({
        cartId: 'cart_123',
        market,
        order: completedOrderGroup,
        orderIds: ['cart_123'],
      }),
    ).toThrow('does not match the requested cart')

    expect(
      server.persistCompletedOrderGroupResourceAccess,
    ).not.toHaveBeenCalled()
  })
})
