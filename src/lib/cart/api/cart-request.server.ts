import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart, Client } from '@spree/sdk'

import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookies,
  getCartCookieState,
  setCartCookies,
} from '@/lib/cookies/cart-cookie.server'
import type { ResolvedMarket } from '@/lib/market/model/market'

import {
  CartMarketMismatchError,
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
} from '../utils/cart-market'

export function getCartRequestOptions(cartToken?: string) {
  const token = getCustomerAccessToken()

  return {
    ...(cartToken ? { spreeToken: cartToken } : {}),
    ...(token ? { token } : {}),
  }
}

export function createCartForCurrentSession(client: Pick<Client, 'carts'>) {
  return client.carts.create(undefined, getCartRequestOptions())
}

export function getRequiredCartCookieStateForMarket(market: ResolvedMarket) {
  const { cartId, cartMarketKey, cartToken } = getCartCookieState()

  if (!cartId || !cartToken) {
    throw new Error('Cart is not available')
  }

  if (!isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)) {
    clearCartCookies()
    throw new CartMarketMismatchError()
  }

  return {
    cartId,
    cartToken,
  }
}

export function persistCartCookies(
  market: ResolvedMarket,
  cart: Pick<SpreeCart, 'id' | 'token'>,
) {
  setCartCookies({
    cartId: cart.id,
    cartMarketKey: getCartMarketKey(market),
    cartToken: cart.token,
  })
}
