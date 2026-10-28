// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Client } from '@spree/sdk'

import {
  removeCartItemForMarket,
  updateCartItemForMarket,
} from './cart-item.server'
import { addToCart } from './cart-item.functions'
import {
  CartResourceIdentityMismatchError,
  CartResourceTokenMissingError,
  CartResourceTypeMismatchError,
} from '../utils/cart-identity'

const server = vi.hoisted(() => ({
  assertCartMarketIdentity: vi.fn(),
  assertCartMutation: vi.fn(),
  assertCartMarket: vi.fn(),
  clearCartCookiesIfCurrentCartMatches: vi.fn(),
  clearCartCookies: vi.fn(),
  createCartForCurrentSession: vi.fn(),
  getCartRequestOptions: vi.fn(() => ({ spreeToken: 'cart-token' })),
  getCartCookieState: vi.fn(),
  isCartCompatible: vi.fn(() => true),
  isCartMarketKeyCompatible: vi.fn(() => true),
  isRecoverableCartCookieError: vi.fn(() => false),
  mapCart: vi.fn((cart: { id: string }) => ({ id: cart.id })),
  persistCartCookies: vi.fn(),
  persistCartCookiesForNewCart: vi.fn(),
  CartSessionMismatchError: class extends Error {
    constructor() {
      super('This cart session no longer matches the active cart.')
      this.name = 'CartSessionMismatchError'
    }
  },
}))

const client = {
  carts: {
    create: vi.fn(),
    get: vi.fn(),
    items: {
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}
const mutationClient = client as unknown as Pick<Client, 'carts'>

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

vi.mock('@/lib/cookies/cart-cookie.server', () => ({
  clearCartCookiesIfCurrentCartMatches:
    server.clearCartCookiesIfCurrentCartMatches,
  clearCartCookies: server.clearCartCookies,
  getCartCookieState: server.getCartCookieState,
  setCartCookies: vi.fn(),
}))

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: vi.fn(() => undefined),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => client,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: vi.fn(() => market),
}))

vi.mock('../mappers/cart.mapper', () => ({
  mapSpreeCartToSummary: server.mapCart,
}))

vi.mock('../utils/cart-errors', () => ({
  CartSessionMismatchError: server.CartSessionMismatchError,
  isRecoverableCartCookieError: server.isRecoverableCartCookieError,
}))

vi.mock('../utils/cart-market', () => ({
  CartMarketMismatchError: class CartMarketMismatchError extends Error {},
  assertSpreeCartResourceHasMarketIdentity: server.assertCartMarketIdentity,
  assertSpreeCartResourceMatchesMarket: server.assertCartMarket,
  getCartMarketKey: vi.fn(),
  isCartMarketKeyCompatibleWithMarket: server.isCartMarketKeyCompatible,
  isSpreeCartResourceCompatibleWithMarket: server.isCartCompatible,
}))

vi.mock('./cart-request.server', () => ({
  assertCartMutationCartMatchesMarket: server.assertCartMutation,
  createCartForCurrentSession: server.createCartForCurrentSession,
  getCartRequestOptions: server.getCartRequestOptions,
  getRequiredCartCookieStateForMarket: vi.fn(),
  persistCartCookies: server.persistCartCookies,
  persistCartCookiesForNewCart: server.persistCartCookiesForNewCart,
}))

const market = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'market-us',
  marketName: 'United States',
}

const mutationInput = {
  cartId: 'cart_us',
  cartToken: 'cart-token',
  client: mutationClient,
  lineItemId: 'li-1',
  market,
}

afterEach(() => {
  vi.clearAllMocks()
  server.getCartCookieState.mockReset()
  server.assertCartMarketIdentity.mockReset()
  server.isCartCompatible.mockReset().mockReturnValue(true)
  server.isCartMarketKeyCompatible.mockReset().mockReturnValue(true)
  server.isRecoverableCartCookieError.mockReturnValue(false)
  server.clearCartCookiesIfCurrentCartMatches.mockReset()
  server.persistCartCookies.mockReset()
  server.persistCartCookiesForNewCart.mockReset()
})

describe('addToCart cart replacement', () => {
  it('stops before adding when an existing cart loses cookie ownership', async () => {
    const activeCart = {
      id: 'cart_us',
      token: 'cart-token',
    }
    server.getCartCookieState.mockReturnValue({
      cartId: activeCart.id,
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    client.carts.get.mockResolvedValue(activeCart)
    server.persistCartCookies.mockReturnValue(false)

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })

    expect(client.carts.items.create).not.toHaveBeenCalled()
  })

  it('does not return a new-cart response after handover loses ownership', async () => {
    const activeCart = {
      id: 'cart_new',
      token: 'new-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    server.createCartForCurrentSession.mockResolvedValue(activeCart)
    client.carts.items.create.mockResolvedValue(activeCart)
    server.persistCartCookiesForNewCart.mockReturnValue(false)

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })

    expect(client.carts.items.create).toHaveBeenCalledOnce()
  })

  it('persists a newly created cart when the current cart belongs to another market', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart_old',
      cartMarketKey: 'market:market-eu',
      cartToken: 'old-cart-token',
    })
    server.isCartMarketKeyCompatible.mockReturnValue(false)
    server.createCartForCurrentSession.mockResolvedValue({
      id: 'cart_new',
      token: 'new-cart-token',
    })
    client.carts.items.create.mockResolvedValue({
      id: 'cart_new',
      token: 'new-cart-token',
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).resolves.toEqual({ id: 'cart_new' })

    expect(server.persistCartCookiesForNewCart).toHaveBeenCalledWith(
      market,
      { id: 'cart_new', token: 'new-cart-token' },
      'cart_new',
      'cart_old',
      'old-cart-token',
    )
    expect(server.createCartForCurrentSession).toHaveBeenCalledWith(
      client,
      market,
    )
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('rejects a non-cart active resource before adding a line item', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart_us',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    client.carts.get.mockResolvedValue({ id: 'or-order' })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toThrow('response is not a cart resource')

    expect(client.carts.items.create).not.toHaveBeenCalled()
    expect(server.createCartForCurrentSession).not.toHaveBeenCalled()
  })

  it('rejects an active cart without a usable token before adding a line item', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart_us',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    client.carts.get.mockResolvedValue({
      id: 'cart_us',
      market_id: 'market-us',
      token: '   ',
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBeInstanceOf(CartResourceTokenMissingError)

    expect(client.carts.items.create).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('fails closed instead of replacing a cart with malformed market identity', async () => {
    const identityError = new Error('cart market identity is malformed')
    server.getCartCookieState.mockReturnValue({
      cartId: 'cart_us',
      cartMarketKey: undefined,
      cartToken: 'cart-token',
    })
    client.carts.get.mockResolvedValue({
      currency: 840,
      id: 'cart_us',
      market_id: 'market-us',
      token: 'cart-token',
    })
    server.isCartCompatible.mockReturnValue(false)
    server.assertCartMarketIdentity.mockImplementationOnce(() => {
      throw identityError
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBe(identityError)

    expect(server.assertCartMarketIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cart_us' }),
      market,
    )
    expect(server.createCartForCurrentSession).not.toHaveBeenCalled()
    expect(client.carts.items.create).not.toHaveBeenCalled()
  })

  it('creates a new cart without reading an order-shaped cookie resource', async () => {
    server.getCartCookieState.mockReturnValue({
      cartId: 'or_order',
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    server.createCartForCurrentSession.mockResolvedValue({
      id: 'cart_new',
      token: 'new-cart-token',
    })
    client.carts.items.create.mockResolvedValue({
      id: 'cart_new',
      token: 'new-cart-token',
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).resolves.toEqual({ id: 'cart_new' })

    expect(client.carts.get).not.toHaveBeenCalled()
    expect(server.createCartForCurrentSession).toHaveBeenCalledWith(
      client,
      market,
    )
    expect(server.persistCartCookiesForNewCart).toHaveBeenCalledWith(
      market,
      { id: 'cart_new', token: 'new-cart-token' },
      'cart_new',
      'or_order',
      'cart-token',
    )
  })

  it('persists a rotated existing-cart token before a retryable item failure', async () => {
    const activeCart = {
      id: 'cart_us',
      token: 'rotated-cart-token',
    }
    const itemError = Object.assign(new Error('Variant is unavailable'), {
      status: 422,
    })
    server.getCartCookieState.mockReturnValue({
      cartId: activeCart.id,
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    server.getCartRequestOptions.mockImplementation((cartToken?: string) => ({
      spreeToken: cartToken ?? 'cart-token',
    }))
    client.carts.get.mockResolvedValue(activeCart)
    client.carts.items.create.mockRejectedValue(itemError)

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBe(itemError)

    expect(server.persistCartCookies).toHaveBeenCalledWith(
      market,
      activeCart,
      activeCart.id,
      'cart-token',
    )
    expect(client.carts.items.create).toHaveBeenCalledWith(
      activeCart.id,
      { quantity: 1, variant_id: 'variant-1' },
      { spreeToken: 'rotated-cart-token' },
    )
  })

  it('projects an existing cart before the item mutation and cookie persistence', async () => {
    const activeCart = {
      id: 'cart_us',
      token: 'cart-token',
    }
    const projectionError = new Error('cart projection failed')
    server.getCartCookieState.mockReturnValue({
      cartId: activeCart.id,
      cartMarketKey: 'market:market-us',
      cartToken: activeCart.token,
    })
    client.carts.get.mockResolvedValue(activeCart)
    server.mapCart.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBe(projectionError)

    expect(client.carts.items.create).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('uses the rotated preflight token for the mutation while retaining the request cookie snapshot', async () => {
    const activeCart = {
      id: 'cart_us',
      token: 'rotated-cart-token',
    }
    const updatedCart = {
      id: activeCart.id,
      token: 'mutation-cart-token',
    }
    server.getCartCookieState.mockReturnValue({
      cartId: activeCart.id,
      cartMarketKey: 'market:market-us',
      cartToken: 'cart-token',
    })
    server.getCartRequestOptions.mockImplementation((cartToken?: string) => ({
      spreeToken: cartToken ?? 'cart-token',
    }))
    client.carts.get.mockResolvedValue(activeCart)
    client.carts.items.create.mockResolvedValue(updatedCart)

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).resolves.toEqual({ id: activeCart.id })

    expect(client.carts.items.create).toHaveBeenCalledWith(
      activeCart.id,
      { quantity: 1, variant_id: 'variant-1' },
      { spreeToken: activeCart.token },
    )
    expect(server.persistCartCookies).toHaveBeenLastCalledWith(
      market,
      updatedCart,
      activeCart.id,
      'cart-token',
    )
  })

  it('rejects a non-cart item response before mapping or session persistence', async () => {
    const activeCart = {
      id: 'cart_new',
      token: 'new-cart-token',
    }
    server.getCartCookieState.mockReturnValue({})
    server.createCartForCurrentSession.mockResolvedValue(activeCart)
    client.carts.items.create.mockResolvedValue({ id: 'or_order' })
    server.mapCart.mockClear()

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBeInstanceOf(CartResourceTypeMismatchError)

    expect(server.mapCart).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })

  it('does not persist a cart session when mapping the add response fails', async () => {
    const activeCart = {
      id: 'cart_new',
      token: 'new-cart-token',
    }
    const mappingError = new Error('Spree money amount is invalid')
    server.getCartCookieState.mockReturnValue({
      cartId: undefined,
      cartMarketKey: undefined,
      cartToken: undefined,
    })
    server.createCartForCurrentSession.mockResolvedValue(activeCart)
    client.carts.items.create.mockResolvedValue(activeCart)
    server.mapCart.mockImplementationOnce(() => {
      throw mappingError
    })

    await expect(
      addToCart({
        data: {
          market: { country: 'us', locale: 'en' },
          quantity: 1,
          variantId: 'variant-1',
        },
      }),
    ).rejects.toBe(mappingError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
    expect(server.persistCartCookiesForNewCart).not.toHaveBeenCalled()
  })
})

describe('cart item mutation market identity', () => {
  it('asserts the actual cart before updating a line item', async () => {
    const updatedCart = { id: 'cart_us' }
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    server.getCartRequestOptions.mockImplementation((cartToken?: string) => ({
      spreeToken: cartToken ?? 'cart-token',
    }))
    client.carts.items.update.mockResolvedValue(updatedCart)

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).resolves.toEqual(updatedCart)

    expect(server.assertCartMutation).toHaveBeenCalledWith({
      cartId: 'cart_us',
      cartToken: 'cart-token',
      client: mutationClient,
      market,
    })
    expect(client.carts.items.update).toHaveBeenCalledWith(
      'cart_us',
      'li-1',
      { quantity: 2 },
      { spreeToken: 'refreshed-cart-token' },
    )
  })

  it('uses the refreshed preflight token to guard the update response write', async () => {
    const updatedCart = {
      id: 'cart_us',
      token: 'mutation-cart-token',
    }
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.update.mockResolvedValue(updatedCart)

    await updateCartItemForMarket({ ...mutationInput, quantity: 2 })

    expect(server.persistCartCookies).toHaveBeenCalledWith(
      market,
      updatedCart,
      'cart_us',
      'refreshed-cart-token',
    )
  })

  it('does not return an update response after cookie ownership is lost', async () => {
    const updatedCart = {
      id: 'cart_us',
      token: 'mutation-cart-token',
    }
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.update.mockResolvedValue(updatedCart)
    server.persistCartCookies.mockReturnValue(false)

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })
  })

  it('rejects an update response for another cart before mapping or persistence', async () => {
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.update.mockResolvedValue({ id: 'cart_other' })
    server.mapCart.mockClear()

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).rejects.toBeInstanceOf(CartResourceIdentityMismatchError)

    expect(server.mapCart).not.toHaveBeenCalled()
    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('does not persist a cart session when mapping the update response fails', async () => {
    const mappingError = new Error('Spree money amount is invalid')
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.update.mockResolvedValue({ id: 'cart_us' })
    server.mapCart.mockImplementationOnce(() => {
      throw mappingError
    })

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).rejects.toBe(mappingError)

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })

  it('does not clear the active session after the cart market assertion fails', async () => {
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMutation.mockRejectedValue(mismatch)

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).rejects.toBe(mismatch)

    expect(client.carts.items.update).not.toHaveBeenCalled()
    expect(server.clearCartCookies).not.toHaveBeenCalled()
  })

  it('clears the cart only through the owner guard after a recoverable update error', async () => {
    const recoverableError = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.update.mockRejectedValue(recoverableError)
    server.isRecoverableCartCookieError.mockReturnValue(true)

    await expect(
      updateCartItemForMarket({ ...mutationInput, quantity: 2 }),
    ).rejects.toBe(recoverableError)

    expect(server.clearCartCookiesIfCurrentCartMatches).toHaveBeenCalledWith(
      'cart_us',
      'refreshed-cart-token',
    )
  })

  it('asserts the actual cart before removing a line item', async () => {
    const updatedCart = { id: 'cart_us' }
    server.assertCartMutation.mockResolvedValue(undefined)
    client.carts.items.delete.mockResolvedValue(updatedCart)

    await expect(removeCartItemForMarket(mutationInput)).resolves.toEqual(
      updatedCart,
    )

    expect(server.assertCartMutation).toHaveBeenCalledWith({
      cartId: 'cart_us',
      cartToken: 'cart-token',
      client: mutationClient,
      market,
    })
    expect(client.carts.items.delete).toHaveBeenCalledWith('cart_us', 'li-1', {
      spreeToken: 'cart-token',
    })
  })

  it('uses the refreshed preflight token to guard the remove response write', async () => {
    const updatedCart = {
      id: 'cart_us',
      token: 'mutation-cart-token',
    }
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.delete.mockResolvedValue(updatedCart)

    await removeCartItemForMarket(mutationInput)

    expect(server.persistCartCookies).toHaveBeenCalledWith(
      market,
      updatedCart,
      'cart_us',
      'refreshed-cart-token',
    )
  })

  it('does not return a remove response after cookie ownership is lost', async () => {
    const updatedCart = {
      id: 'cart_us',
      token: 'mutation-cart-token',
    }
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.delete.mockResolvedValue(updatedCart)
    server.persistCartCookies.mockReturnValue(false)

    await expect(removeCartItemForMarket(mutationInput)).rejects.toMatchObject({
      name: 'CartSessionMismatchError',
    })
  })

  it('does not persist a cart session when mapping the remove response fails', async () => {
    const mappingError = new Error('Spree money amount is invalid')
    server.assertCartMutation.mockResolvedValue('refreshed-cart-token')
    client.carts.items.delete.mockResolvedValue({ id: 'cart_us' })
    server.mapCart.mockImplementationOnce(() => {
      throw mappingError
    })

    await expect(removeCartItemForMarket(mutationInput)).rejects.toBe(
      mappingError,
    )

    expect(server.persistCartCookies).not.toHaveBeenCalled()
  })
})
