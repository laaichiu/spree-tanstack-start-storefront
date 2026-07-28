import '@tanstack/react-start/server-only'

import {
  clearCartCookies,
  getCartCookieState,
} from '@/lib/cookies/cart-cookie.server'
import type { ResolvedMarket } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import {
  assertSpreeCartResourceMatchesMarket,
  isCartMarketKeyCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarket,
} from '../utils/cart-market'
import { isRecoverableCartResponseError } from '../utils/cart-errors'
import {
  getCartRequestOptions,
  persistCartCookies,
} from './cart-request.server'

export async function getCartForMarket(
  market: ResolvedMarket,
  cartId?: string,
) {
  const {
    cartId: cookieCartId,
    cartMarketKey,
    cartToken,
  } = getCartCookieState()
  const activeCartId = cartId ?? cookieCartId

  if (!activeCartId) {
    return null
  }

  if (!cartId && !isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)) {
    clearCartCookies()
    return null
  }

  try {
    const client = getServerSpreeClientForMarket(market)
    const cart = await client.carts.get(activeCartId, {
      ...getCartRequestOptions(cartToken),
    })

    if (!isSpreeCartResourceCompatibleWithMarket(cart, market)) {
      clearCartCookies()

      if (cartId) {
        assertSpreeCartResourceMatchesMarket(cart, market)
      }

      return null
    }

    return mapSpreeCartToSummary(cart)
  } catch (error) {
    const token = getCartRequestOptions().token

    if (token) {
      try {
        const response = await getServerSpreeClientForMarket(market).carts.list(
          {
            token,
          },
        )
        if (response.data.length > 0) {
          const authenticatedCart = response.data[0]

          if (!cartId || authenticatedCart.id === cartId) {
            assertSpreeCartResourceMatchesMarket(authenticatedCart, market)
            persistCartCookies(market, authenticatedCart)

            return mapSpreeCartToSummary(authenticatedCart)
          }
        }
      } catch {
        // Fall through to the order lookup below.
      }
    }

    try {
      const order = await getServerSpreeClientForMarket(market).orders.get(
        activeCartId,
        undefined,
        getCartRequestOptions(cartToken),
      )

      assertSpreeCartResourceMatchesMarket(order, market)

      return mapSpreeCartToSummary(order)
    } catch {
      if (!cartId && isRecoverableCartResponseError(error)) {
        clearCartCookies()
        return null
      }

      throw error
    }
  }
}
