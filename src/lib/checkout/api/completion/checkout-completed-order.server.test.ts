// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { readCompletedCheckoutOrder } from './checkout-completed-order.server'

const server = vi.hoisted(() => ({
  getCompletedOrderAccessToken: vi.fn(),
  getCompletedOrderGroupAccess: vi.fn(),
  getCustomerAccessToken: vi.fn(),
  getCustomerRefreshToken: vi.fn(),
  getClient: vi.fn(),
  mapCheckout: vi.fn(),
  mapOrderGroup: vi.fn(),
  withCustomerSession: vi.fn(),
}))

vi.mock('@/lib/cookies/completed-order-cookie.server', () => ({
  getCompletedOrderAccessToken: server.getCompletedOrderAccessToken,
  getCompletedOrderGroupAccess: server.getCompletedOrderGroupAccess,
}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: server.getCustomerAccessToken,
  getCustomerRefreshToken: server.getCustomerRefreshToken,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getClient,
}))

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: server.mapCheckout,
  mapSpreeOrderGroupToCheckoutOrder: server.mapOrderGroup,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const client = {
  customer: {
    orders: {
      get: vi.fn(),
    },
  },
  orders: {
    get: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  server.getCompletedOrderAccessToken.mockReturnValue(undefined)
  server.getCompletedOrderGroupAccess.mockReturnValue(undefined)
  server.getCustomerAccessToken.mockReturnValue(undefined)
  server.getCustomerRefreshToken.mockReturnValue(undefined)
  server.getClient.mockReturnValue(client)
  server.withCustomerSession.mockImplementation(
    async (
      action: (context: { client: typeof client; token: string }) => unknown,
      options?: { client?: typeof client },
    ) =>
      action({
        client: options?.client ?? client,
        token: server.getCustomerAccessToken() ?? 'session-token',
      }),
  )
  client.customer.orders.get.mockReset()
  client.orders.get.mockReset()
})

describe('completed checkout order access', () => {
  it('does not fetch a guest group without its member access record', async () => {
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'ogrp_fixture' }),
    ).resolves.toBeNull()
    expect(client.orders.get).not.toHaveBeenCalled()
    expect(server.mapOrderGroup).not.toHaveBeenCalled()
  })
  it('does not map a guest order from another market', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'EUR',
      id: 'or_eu',
      market_id: 'market-eu',
    }
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    client.orders.get.mockResolvedValue(completedOrder)

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_eu' }),
    ).resolves.toBeNull()

    expect(server.mapCheckout).not.toHaveBeenCalled()
  })

  it('does not map a guest order with a different requested resource identity', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_other',
      market_id: 'market-us',
    }
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    client.orders.get.mockResolvedValue(completedOrder)

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_requested' }),
    ).resolves.toBeNull()

    expect(server.mapCheckout).not.toHaveBeenCalled()
    expect(client.customer.orders.get).not.toHaveBeenCalled()
  })

  it('keeps cart-handle lookup compatible with an order resource response', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_us',
      market_id: 'market-us',
    }
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    client.orders.get.mockResolvedValue(completedOrder)
    server.mapCheckout.mockReturnValue({ id: 'or_us' })

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'cart_us' }),
    ).resolves.toEqual({ id: 'or_us' })

    expect(server.mapCheckout).toHaveBeenCalledWith(completedOrder, {
      locale: 'en',
    })
  })

  it('maps a customer order only after the current market check', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_us',
      market_id: 'market-us',
    }
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    client.customer.orders.get.mockResolvedValue(completedOrder)
    server.mapCheckout.mockReturnValue({ id: 'or_us' })

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_us' }),
    ).resolves.toEqual({ id: 'or_us' })

    expect(server.mapCheckout).toHaveBeenCalledWith(completedOrder, {
      locale: 'en',
    })
  })

  it('uses the market-specific customer session and refreshed token', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_us',
      market_id: 'market-us',
    }
    server.getCustomerRefreshToken.mockReturnValue('refresh-token')
    server.withCustomerSession.mockImplementationOnce(
      async (
        action: (context: { client: typeof client; token: string }) => unknown,
        options?: { client?: typeof client },
      ) =>
        action({
          client: options?.client ?? client,
          token: 'refreshed-token',
        }),
    )
    client.customer.orders.get.mockResolvedValue(completedOrder)
    server.mapCheckout.mockReturnValue({ id: 'or_us' })

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_us' }),
    ).resolves.toEqual({ id: 'or_us' })

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
    expect(client.customer.orders.get).toHaveBeenCalledWith(
      'or_us',
      { expand: expect.any(Array) },
      { token: 'refreshed-token' },
    )
  })

  it('keeps a customer cart-handle lookup compatible with an Order response', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_us',
      market_id: 'market-us',
    }
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    client.customer.orders.get.mockResolvedValue(completedOrder)
    server.mapCheckout.mockReturnValue({ id: 'or_us' })

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'cart_us' }),
    ).resolves.toEqual({ id: 'or_us' })

    expect(server.mapCheckout).toHaveBeenCalledWith(completedOrder, {
      locale: 'en',
    })
  })

  it('does not map a customer order with a different requested identity', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_other',
      market_id: 'market-us',
    }
    server.getCustomerAccessToken.mockReturnValue('customer-token')
    client.customer.orders.get.mockResolvedValue(completedOrder)

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_requested' }),
    ).resolves.toBeNull()

    expect(server.mapCheckout).not.toHaveBeenCalled()
  })

  it('does not swallow a customer order projection failure', async () => {
    const completedOrder = {
      completed_at: '2026-06-16T11:30:00Z',
      currency: 'USD',
      id: 'or_us',
      market_id: 'market-us',
    }
    const projectionError = new Error('malformed customer order')

    server.getCustomerAccessToken.mockReturnValue('customer-token')
    client.customer.orders.get.mockResolvedValue(completedOrder)
    server.mapCheckout.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      readCompletedCheckoutOrder({ market, orderId: 'or_us' }),
    ).rejects.toBe(projectionError)
    expect(server.mapCheckout).toHaveBeenCalledWith(completedOrder, {
      locale: 'en',
    })
  })

  it('reads a guest order group using its persisted member access record', async () => {
    const orders = [
      {
        ...baseCart,
        completed_at: '2026-09-26T08:00:00Z',
        currency: 'USD',
        cart_id: null,
        number: 'R-multi-seller-1',
        id: 'or_seller_one',
        market_id: 'market-us',
      },
      {
        ...baseCart,
        completed_at: '2026-09-26T08:00:00Z',
        currency: 'USD',
        cart_id: null,
        number: 'R-multi-seller-2',
        id: 'or_seller_two',
        market_id: 'market-us',
      },
    ]
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    server.getCompletedOrderGroupAccess.mockReturnValue({
      number: 'R-multi-seller',
      orderIds: ['or_seller_one', 'or_seller_two'],
    })
    const group = {
      ...baseCart,
      fulfillment_status: null,
      payment_status: null,
      completed_at: '2026-09-26T08:00:00Z',
      currency: 'USD',
      id: 'ogrp_multi_seller',
      number: 'R-multi-seller',
      orders,
    }
    client.orders.get.mockResolvedValue(group)
    server.mapOrderGroup.mockReturnValue({ id: 'ogrp_multi_seller' })

    await expect(
      readCompletedCheckoutOrder({
        market,
        orderId: 'ogrp_multi_seller',
      }),
    ).resolves.toEqual({ id: 'ogrp_multi_seller' })

    expect(client.orders.get).toHaveBeenCalledTimes(1)
    expect(server.mapOrderGroup).toHaveBeenCalledWith(group, { locale: 'en' })
  })

  it('rejects an order lookup that returns a child instead of the requested group', async () => {
    server.getCompletedOrderAccessToken.mockReturnValue('guest-token')
    server.getCompletedOrderGroupAccess.mockReturnValue({
      number: 'R-multi-seller',
      orderIds: ['or_seller_one', 'or_seller_two'],
    })
    client.orders.get
      .mockResolvedValueOnce({
        completed_at: '2026-09-26T08:00:00Z',
        currency: 'USD',
        cart_id: null,
        number: 'R-multi-seller-1',
        id: 'or_seller_one',
        market_id: 'market-us',
      })
      .mockRejectedValueOnce(new Error('unavailable'))

    await expect(
      readCompletedCheckoutOrder({
        market,
        orderId: 'ogrp_multi_seller',
      }),
    ).resolves.toBeNull()

    expect(server.mapOrderGroup).not.toHaveBeenCalled()
  })
})
