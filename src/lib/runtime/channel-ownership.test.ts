// @vitest-environment node

import type { Channel, Client } from '@spree/sdk'
import { describe, expect, it, vi } from 'vitest'

import {
  StorefrontChannelMismatchError,
  withStorefrontChannelOwnership,
} from './channel-ownership'

let fixtureClientIndex = 0

function createClient({
  cart,
  channel,
  orders,
}: {
  cart: unknown
  channel: Channel
  orders?: unknown
}) {
  const getChannel = vi.fn(async () => channel)
  const getCart = vi.fn(async () => cart)
  const listOrders = vi.fn(async () => orders)
  const client = {
    carts: { get: getCart },
    channel: { get: getChannel },
    customer: { orders: { list: listOrders } },
  } as unknown as Client

  return {
    client: withStorefrontChannelOwnership(client, {
      cacheKey: `channel-ownership-fixture-${fixtureClientIndex++}`,
      channel: channel.code,
    }),
    getCart,
    getChannel,
    listOrders,
  }
}

const onlineChannel = {
  active: true,
  code: 'online-test',
  default: true,
  guest_checkout: true,
  id: 'ch_online',
  name: 'Online',
  storefront_access: 'public',
} satisfies Channel

describe('Storefront Channel ownership', () => {
  it('validates every order in a returned OrderGroup', async () => {
    const group = {
      id: 'ogrp_fixture',
      orders: [
        { id: 'or_one', channel_id: onlineChannel.id },
        { id: 'or_two', channel_id: onlineChannel.id },
      ],
    }
    const { client } = createClient({ cart: group, channel: onlineChannel })
    await expect(client.carts.get('cart_fixture')).resolves.toBe(group)
  })

  it.each([
    [
      { id: 'or_one', channel_id: onlineChannel.id },
      { id: 'or_two', channel_id: 'ch_other' },
    ],
    [{ id: 'or_one', channel_id: null }],
    [{ id: 'cart_wrong', channel_id: onlineChannel.id }],
    [],
  ])(
    'rejects malformed or mixed-owner OrderGroup children: %j',
    async (...orders) => {
      // Vitest spreads array cases; reconstruct the returned children.
      const { client } = createClient({
        cart: { id: 'ogrp_fixture', orders },
        channel: onlineChannel,
      })
      await expect(client.carts.get('cart_fixture')).rejects.toBeInstanceOf(
        StorefrontChannelMismatchError,
      )
    },
  )
  it('accepts Cart responses owned by the resolved Channel', async () => {
    const { client, getChannel } = createClient({
      cart: { channel_id: onlineChannel.id, id: 'cart_123' },
      channel: onlineChannel,
    })

    await expect(client.carts.get('cart_123')).resolves.toMatchObject({
      id: 'cart_123',
    })
    expect(getChannel).toHaveBeenCalledTimes(1)
  })

  it('rejects Cart responses owned by another Channel', async () => {
    const { client } = createClient({
      cart: { channel_id: 'ch_wholesale', id: 'cart_123' },
      channel: onlineChannel,
    })

    await expect(client.carts.get('cart_123')).rejects.toBeInstanceOf(
      StorefrontChannelMismatchError,
    )
  })

  it('rejects Cart responses without a canonical Channel identity', async () => {
    const { client } = createClient({
      cart: { channel_id: null, id: 'cart_123' },
      channel: onlineChannel,
    })

    await expect(client.carts.get('cart_123')).rejects.toBeInstanceOf(
      StorefrontChannelMismatchError,
    )
  })

  it('rejects an Order list when any Order belongs to another Channel', async () => {
    const { client } = createClient({
      cart: null,
      channel: onlineChannel,
      orders: {
        data: [
          { channel_id: onlineChannel.id, id: 'or_123' },
          { channel_id: 'ch_wholesale', id: 'or_456' },
        ],
      },
    })

    await expect(client.customer.orders.list()).rejects.toBeInstanceOf(
      StorefrontChannelMismatchError,
    )
  })

  it('does not resolve Channel context for unrelated resources', async () => {
    const { client, getChannel } = createClient({
      cart: { id: 'prod_123' },
      channel: onlineChannel,
    })

    await expect(client.carts.get('prod_123')).resolves.toMatchObject({
      id: 'prod_123',
    })
    expect(getChannel).not.toHaveBeenCalled()
  })
})
