import type { Cart as SpreeCart } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getCartCookieState } from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import {
  assertCartResourceHasToken,
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
  isCartResourceId,
} from '../utils/cart-identity'
import {
  assertSpreeCartResourceHasMarketIdentity,
  assertSpreeCartResourceMatchesMarket,
  isCartMarketKeyCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarket,
} from '../utils/cart-market'
import {
  CartSessionMismatchError,
  isRecoverableCartCookieError,
} from '../utils/cart-errors'
import {
  createCartForCurrentSession,
  getCartRequestOptions,
  getRequiredCartCookieStateForMarket,
  persistCartCookies,
  persistCartCookiesForNewCart,
} from './cart-request.server'

export const addToCart = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        cartId: z.string().trim().min(1).optional(),
        market: marketInputSchema,
        quantity: z.number().int().min(1).max(99),
        variantId: z.string().trim().min(1),
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const { cartId, cartMarketKey, cartToken } = getCartCookieState()
    let activeCart: SpreeCart
    let createdNewCart = false

    const hasUsableCartCookie =
      Boolean(cartId) &&
      isCartResourceId(cartId) &&
      Boolean(cartToken) &&
      isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)

    if (!hasUsableCartCookie) {
      activeCart = await createCartForCurrentSession(client, market)
      createdNewCart = true
    } else {
      try {
        activeCart = await client.carts.get(cartId, {
          ...getCartRequestOptions(cartToken),
        })

        assertCartResourceIsCart(activeCart)
        assertCartResourceMatchesId(activeCart, cartId)

        if (!isSpreeCartResourceCompatibleWithMarket(activeCart, market)) {
          assertSpreeCartResourceHasMarketIdentity(activeCart, market)
          activeCart = await createCartForCurrentSession(client, market)
          createdNewCart = true
        } else {
          assertCartResourceHasToken(activeCart)
          mapSpreeCartToSummary(activeCart)
        }
      } catch (error) {
        if (!isRecoverableCartCookieError(error)) {
          throw error
        }

        activeCart = await createCartForCurrentSession(client, market)
        createdNewCart = true
      }
    }

    if (!createdNewCart) {
      const didPersistCartCookies = persistCartCookies(
        market,
        activeCart,
        activeCart.id,
        cartToken,
      )

      if (didPersistCartCookies === false) {
        throw new CartSessionMismatchError()
      }
    }

    const updatedCart = await client.carts.items.create(
      activeCart.id,
      {
        quantity: input.quantity,
        variant_id: input.variantId,
      },
      {
        ...getCartRequestOptions(activeCart.token),
      },
    )

    assertCartResourceIsCart(updatedCart)
    assertCartResourceMatchesId(updatedCart, activeCart.id)
    assertSpreeCartResourceMatchesMarket(updatedCart, market)

    const normalizedCart = mapSpreeCartToSummary(updatedCart)

    if (createdNewCart) {
      const didPersistCartCookies = persistCartCookiesForNewCart(
        market,
        updatedCart,
        activeCart.id,
        cartId,
        cartToken,
      )

      if (didPersistCartCookies === false) {
        throw new CartSessionMismatchError()
      }
    } else {
      const didPersistCartCookies = persistCartCookies(
        market,
        updatedCart,
        activeCart.id,
        cartToken,
      )

      if (didPersistCartCookies === false) {
        throw new CartSessionMismatchError()
      }
    }

    return normalizedCart
  })

export const updateCartItem = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        cartId: z.string().trim().min(1).optional(),
        lineItemId: z.string().trim().min(1),
        market: marketInputSchema,
        quantity: z.number().int().min(1).max(99),
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const { cartId, cartToken } = getRequiredCartCookieStateForMarket(market)
    const { updateCartItemForMarket } = await import('./cart-item.server')

    return updateCartItemForMarket({
      cartId,
      cartToken,
      client,
      lineItemId: input.lineItemId,
      market,
      quantity: input.quantity,
    })
  })

export const removeCartItem = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        cartId: z.string().trim().min(1).optional(),
        lineItemId: z.string().trim().min(1),
        market: marketInputSchema,
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const { cartId, cartToken } = getRequiredCartCookieStateForMarket(market)
    const { removeCartItemForMarket } = await import('./cart-item.server')

    return removeCartItemForMarket({
      cartId,
      cartToken,
      client,
      lineItemId: input.lineItemId,
      market,
    })
  })
