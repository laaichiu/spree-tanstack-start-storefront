import type { Cart as SpreeCart } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import {
  clearCartCookies,
  getCartCookieState,
} from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import {
  isCartMarketKeyCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarket,
} from '../utils/cart-market'
import { isRecoverableCartCookieError } from '../utils/cart-errors'
import {
  createCartForCurrentSession,
  getCartRequestOptions,
  getRequiredCartCookieStateForMarket,
  persistCartCookies,
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

    if (
      !cartId ||
      !cartToken ||
      !isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)
    ) {
      activeCart = await createCartForCurrentSession(client)
    } else {
      try {
        activeCart = await client.carts.get(cartId, {
          ...getCartRequestOptions(cartToken),
        })

        if (!isSpreeCartResourceCompatibleWithMarket(activeCart, market)) {
          activeCart = await createCartForCurrentSession(client)
        }
      } catch (error) {
        if (!isRecoverableCartCookieError(error)) {
          throw error
        }

        activeCart = await createCartForCurrentSession(client)
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

    persistCartCookies(market, updatedCart)

    return mapSpreeCartToSummary(updatedCart)
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
    let updatedCart: SpreeCart

    try {
      updatedCart = await client.carts.items.update(
        cartId,
        input.lineItemId,
        {
          quantity: input.quantity,
        },
        {
          ...getCartRequestOptions(cartToken),
        },
      )
    } catch (error) {
      if (isRecoverableCartCookieError(error)) {
        clearCartCookies()
      }

      throw error
    }

    persistCartCookies(market, updatedCart)

    return mapSpreeCartToSummary(updatedCart)
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
    let updatedCart: SpreeCart

    try {
      updatedCart = await client.carts.items.delete(cartId, input.lineItemId, {
        ...getCartRequestOptions(cartToken),
      })
    } catch (error) {
      if (isRecoverableCartCookieError(error)) {
        clearCartCookies()
      }

      throw error
    }

    persistCartCookies(market, updatedCart)

    return mapSpreeCartToSummary(updatedCart)
  })
