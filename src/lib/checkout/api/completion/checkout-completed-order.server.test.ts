import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import { getCompletedOrderAccessToken } from '@/lib/cookies/completed-order-cookie.server'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { completedOrderExpand } from '../checkout-order-expands'
import { readCompletedCheckoutOrder } from './checkout-completed-order.server'

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: vi.fn(),
}))

vi.mock('@/lib/cookies/completed-order-cookie.server', () => ({
  getCompletedOrderAccessToken: vi.fn(),
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: vi.fn((order: { id: string }) => ({
    currentStep: 'complete',
    id: order.id,
  })),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_123',
}

function completedOrder(id: string) {
  return {
    completed_at: '2026-07-08T10:00:00Z',
    id,
  }
}

function setSpreeClient({
  customerOrder,
  guestOrder,
}: {
  customerOrder?: unknown
  guestOrder?: unknown
} = {}) {
  const ordersGet = vi.fn(async () => guestOrder)
  const customerOrdersGet = vi.fn(async () => customerOrder)

  vi.mocked(getServerSpreeClientForMarket).mockReturnValue({
    customer: {
      orders: {
        get: customerOrdersGet,
      },
    },
    orders: {
      get: ordersGet,
    },
  } as never)

  return {
    customerOrdersGet,
    ordersGet,
  }
}

describe('readCompletedCheckoutOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCompletedOrderAccessToken).mockReturnValue(undefined)
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
  })

  it('reads a guest completed order with the completed order access token', async () => {
    vi.mocked(getCompletedOrderAccessToken).mockReturnValue('order-token')
    const { customerOrdersGet, ordersGet } = setSpreeClient({
      guestOrder: completedOrder('or_123'),
    })

    await expect(
      readCompletedCheckoutOrder({
        market,
        orderId: 'or_123',
      }),
    ).resolves.toEqual({
      currentStep: 'complete',
      id: 'or_123',
    })
    expect(ordersGet).toHaveBeenCalledWith(
      'or_123',
      {
        expand: completedOrderExpand,
      },
      {
        spreeToken: 'order-token',
      },
    )
    expect(customerOrdersGet).not.toHaveBeenCalled()
    expect(mapSpreeCheckoutToOrder).toHaveBeenCalledWith(
      completedOrder('or_123'),
    )
  })

  it('falls back to the authenticated customer order lookup', async () => {
    vi.mocked(getCompletedOrderAccessToken).mockReturnValue('order-token')
    vi.mocked(getCustomerAccessToken).mockReturnValue('customer-token')
    const { customerOrdersGet } = setSpreeClient({
      customerOrder: completedOrder('or_customer'),
      guestOrder: null,
    })

    await expect(
      readCompletedCheckoutOrder({
        market,
        orderId: 'or_customer',
      }),
    ).resolves.toEqual({
      currentStep: 'complete',
      id: 'or_customer',
    })
    expect(customerOrdersGet).toHaveBeenCalledWith(
      'or_customer',
      {
        expand: completedOrderExpand,
      },
      {
        token: 'customer-token',
      },
    )
  })

  it('returns null when neither lookup can read a completed order', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue('customer-token')
    setSpreeClient({
      customerOrder: {
        completed_at: null,
        id: 'or_pending',
      },
    })

    await expect(
      readCompletedCheckoutOrder({
        market,
        orderId: 'or_pending',
      }),
    ).resolves.toBeNull()
  })
})
