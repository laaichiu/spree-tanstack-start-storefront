// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckoutOrderResourceIdentityMismatchError } from '@/lib/checkout/utils/order-resource-identity'

import {
  lookupCheckoutOrderWithCartCredentials,
  replayCompletedCheckoutGroupWithCartCredentials,
} from './checkout-order-lookup'

const server = vi.hoisted(() => ({
  getRequestOptions: vi.fn(),
}))

vi.mock('@/lib/checkout/api/checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getRequestOptions,
}))

const completedOrder = {
  completed_at: '2026-08-26T10:00:00Z',
  id: 'or_123',
}

const client = {
  carts: {
    complete: vi.fn(),
    get: vi.fn(),
  },
  orders: {
    get: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  server.getRequestOptions.mockImplementation(
    (cartToken?: string, customerToken?: string) => ({
      ...(cartToken ? { spreeToken: cartToken } : {}),
      ...(customerToken ? { token: customerToken } : {}),
    }),
  )
  client.orders.get.mockReset()
  client.carts.complete.mockReset()
  client.carts.get.mockReset()
})

describe('completed OrderGroup replay', () => {
  const completedGroup = {
    completed_at: '2026-08-26T10:00:00Z',
    id: 'ogrp_123',
    orders: [{ id: 'or_123' }, { id: 'or_456' }],
  }

  it('replays only after the completed Cart is no longer readable', async () => {
    client.carts.get.mockRejectedValue({ status: 404 })
    client.carts.complete.mockResolvedValue(completedGroup)

    await expect(
      replayCompletedCheckoutGroupWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBe(completedGroup)

    expect(client.carts.get).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'cart-token',
    })
    expect(client.carts.complete).toHaveBeenCalledWith('cart_123', {
      spreeToken: 'cart-token',
    })
  })

  it.each([
    ['readable Cart', null],
    ['network failure', { status: 503 }],
  ])('does not replay an unproven completed Cart: %s', async (_, error) => {
    if (error) {
      client.carts.get.mockRejectedValue(error)
    } else {
      client.carts.get.mockResolvedValue({ id: 'cart_123' })
    }

    await expect(
      replayCompletedCheckoutGroupWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBeNull()

    expect(client.carts.complete).not.toHaveBeenCalled()
  })

  it('does not replay without the original Cart credential', async () => {
    await expect(
      replayCompletedCheckoutGroupWithCartCredentials({
        cartId: 'cart_123',
        client,
      }),
    ).resolves.toBeNull()

    expect(client.carts.get).not.toHaveBeenCalled()
    expect(client.carts.complete).not.toHaveBeenCalled()
  })
})

describe('checkout order lookup credentials', () => {
  it('accepts a Cart lookup returning the whole OrderGroup', async () => {
    const group = {
      id: 'ogrp_fixture',
      completed_at: '2026-10-14T00:00:00Z',
      orders: [{ id: 'or_one' }, { id: 'or_two' }],
    }
    client.orders.get.mockResolvedValue(group)
    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBe(group)
    expect(client.orders.get).toHaveBeenCalledOnce()
    expect(client.carts.complete).not.toHaveBeenCalled()
  })
  it('returns the first order response without a duplicate request', async () => {
    client.orders.get.mockResolvedValue(completedOrder)

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBe(completedOrder)

    expect(client.orders.get).toHaveBeenCalledTimes(1)
    expect(client.orders.get).toHaveBeenCalledWith('cart_123', undefined, {
      spreeToken: 'cart-token',
    })
  })

  it('retries with only the guest token after mixed credentials fail', async () => {
    const customerRequestOptions = {
      spreeToken: 'cart-token',
      token: 'customer-token',
    }
    const guestRequestOptions = { spreeToken: 'cart-token' }
    server.getRequestOptions
      .mockReturnValueOnce(customerRequestOptions)
      .mockReturnValueOnce(guestRequestOptions)
    client.orders.get
      .mockRejectedValueOnce(new Error('customer scope does not own cart'))
      .mockResolvedValueOnce(completedOrder)

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBe(completedOrder)

    expect(client.orders.get).toHaveBeenNthCalledWith(
      1,
      'cart_123',
      undefined,
      customerRequestOptions,
    )
    expect(client.orders.get).toHaveBeenNthCalledWith(
      2,
      'cart_123',
      undefined,
      guestRequestOptions,
    )
  })

  it('does not retry when no customer token is present', async () => {
    client.orders.get.mockRejectedValue(new Error('order unavailable'))

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBeNull()

    expect(client.orders.get).toHaveBeenCalledTimes(1)
  })

  it('returns null when the guest-token fallback also fails', async () => {
    server.getRequestOptions
      .mockReturnValueOnce({
        spreeToken: 'cart-token',
        token: 'customer-token',
      })
      .mockReturnValueOnce({ spreeToken: 'cart-token' })
    client.orders.get.mockRejectedValue(new Error('order unavailable'))

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
      }),
    ).resolves.toBeNull()

    expect(client.orders.get).toHaveBeenCalledTimes(2)
  })

  it('uses completed-order access after cart credentials fail', async () => {
    server.getRequestOptions.mockReturnValue({})
    client.orders.get
      .mockRejectedValueOnce(new Error('cart session unavailable'))
      .mockResolvedValueOnce(completedOrder)

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        completedOrderToken: ' completed-order-token ',
        client,
      }),
    ).resolves.toBe(completedOrder)

    expect(client.orders.get).toHaveBeenNthCalledWith(
      1,
      'cart_123',
      undefined,
      {},
    )
    expect(client.orders.get).toHaveBeenNthCalledWith(
      2,
      'cart_123',
      undefined,
      { spreeToken: 'completed-order-token' },
    )
  })

  it('does not let completed-order access replace a successful cart lookup', async () => {
    client.orders.get.mockResolvedValue(completedOrder)

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        completedOrderToken: 'completed-order-token',
        client,
      }),
    ).resolves.toBe(completedOrder)

    expect(client.orders.get).toHaveBeenCalledOnce()
  })

  it('fails closed without falling back when the first response has another identity', async () => {
    client.orders.get.mockResolvedValue({ id: 'or_other' })

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'or_123',
        cartToken: 'cart-token',
        completedOrderToken: 'completed-order-token',
        client,
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderResourceIdentityMismatchError)

    expect(client.orders.get).toHaveBeenCalledOnce()
  })

  it.each([null, [], {}, { id: 'or_other' }])(
    'fails closed for a malformed or wrong-owner guest response: %s',
    async (guestOrder) => {
      server.getRequestOptions
        .mockReturnValueOnce({
          spreeToken: 'cart-token',
          token: 'customer-token',
        })
        .mockReturnValueOnce({ spreeToken: 'cart-token' })
      client.orders.get
        .mockRejectedValueOnce(new Error('customer scope does not own cart'))
        .mockResolvedValueOnce(guestOrder)

      await expect(
        lookupCheckoutOrderWithCartCredentials({
          cartId: 'or_123',
          cartToken: 'cart-token',
          completedOrderToken: 'completed-order-token',
          client,
        }),
      ).rejects.toBeInstanceOf(CheckoutOrderResourceIdentityMismatchError)

      expect(client.orders.get).toHaveBeenCalledTimes(2)
    },
  )

  it('fails closed for a malformed completed-order response', async () => {
    server.getRequestOptions.mockReturnValue({})
    client.orders.get
      .mockRejectedValueOnce(new Error('cart session unavailable'))
      .mockResolvedValueOnce(null)

    await expect(
      lookupCheckoutOrderWithCartCredentials({
        cartId: 'cart_123',
        completedOrderToken: 'completed-order-token',
        client,
      }),
    ).rejects.toBeInstanceOf(CheckoutOrderResourceIdentityMismatchError)

    expect(client.orders.get).toHaveBeenCalledTimes(2)
  })
})
