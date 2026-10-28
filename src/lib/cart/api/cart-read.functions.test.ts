// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { getCart } from './cart-read.functions'

const server = vi.hoisted(() => ({
  getCartForMarket: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      handler:
        (handler: (options: { data: unknown }) => unknown) =>
        async (options: { data: unknown }) =>
          handler(options),
      validator: () => builder,
    }

    return builder
  },
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('./cart-read.server', () => ({
  getCartForMarket: server.getCartForMarket,
}))

describe('getCart input boundary', () => {
  it.each(['or_123', 'cart_', 'cart-current'])(
    'rejects a non-Cart optional cart id before market resolution: %s',
    async (cartId) => {
      await expect(
        getCart({
          data: {
            cartId,
            market: { country: 'us', locale: 'en' },
          },
        }),
      ).rejects.toThrow()

      expect(server.resolveServerMarket).not.toHaveBeenCalled()
      expect(server.getCartForMarket).not.toHaveBeenCalled()
    },
  )

  it('allows an omitted cart id for the implicit active-cart read', async () => {
    const market = { country: 'us', locale: 'en' }
    const resolvedMarket = { marketId: 'market-us' }
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.getCartForMarket.mockResolvedValue(null)

    await expect(getCart({ data: { market } })).resolves.toBeNull()

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getCartForMarket).toHaveBeenCalledWith(
      resolvedMarket,
      undefined,
    )
  })
})
