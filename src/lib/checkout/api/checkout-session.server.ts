import '@tanstack/react-start/server-only'

import type { Client, RequestOptions } from '@spree/sdk'

import type { ResolvedMarket } from '@/lib/market/model/market'
import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookies,
  getCartCookieState,
  setCartCookies,
} from '@/lib/cookies/cart-cookie.server'
import { setCompletedOrderAccessCookie } from '@/lib/cookies/completed-order-cookie.server'
import {
  assertSpreeCartResourceMatchesMarket,
  CartMarketMismatchError,
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
} from '@/lib/cart/utils/cart-market'
import { buildCompletedOrderAccess } from '@/lib/checkout/utils/completion/completed-order-access'

export type CheckoutMarket = Pick<
  ResolvedMarket,
  'country' | 'currencyCode' | 'locale' | 'marketId'
>

const SAVED_PAYMENT_METHOD_SESSION_ERROR =
  'Sign in again to use a saved payment method, or choose a new payment method.'

type CheckoutResourceWithToken = {
  id: string
  token?: unknown
}

function readTokenFromResource(resource: { token?: unknown }) {
  return typeof resource.token === 'string' && resource.token
    ? resource.token
    : undefined
}

export function getCheckoutCartRequestOptions(cartToken?: string) {
  const token = getCustomerAccessToken()

  return {
    ...(cartToken ? { spreeToken: cartToken } : {}),
    ...(token ? { token } : {}),
  }
}

export async function requireCheckoutCustomerCartAssociation({
  cartId,
  cartToken,
  client,
  market,
}: {
  cartId: string
  cartToken?: string
  client: Pick<Client, 'carts'>
  market: CheckoutMarket
}): Promise<RequestOptions> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  if (!cartToken || !requestOptions.token) {
    throw new Error(SAVED_PAYMENT_METHOD_SESSION_ERROR)
  }

  try {
    const cart = await client.carts.associate(cartId, requestOptions)

    assertSpreeCartResourceMatchesMarket(cart, market)
    persistCheckoutCartCookies(cart, market, cartToken)

    return requestOptions
  } catch (error) {
    if (error instanceof CartMarketMismatchError) {
      throw error
    }

    throw new Error(SAVED_PAYMENT_METHOD_SESSION_ERROR)
  }
}

export function getCheckoutCartCookieStateForMarket(market: CheckoutMarket) {
  const state = getCartCookieState()

  if (!isCartMarketKeyCompatibleWithMarket(state.cartMarketKey, market)) {
    clearCartCookies()
    throw new CartMarketMismatchError()
  }

  return state
}

export function persistCheckoutCartCookies(
  resource: CheckoutResourceWithToken,
  market: CheckoutMarket,
  fallbackToken?: string,
) {
  const nextCartToken = readTokenFromResource(resource) ?? fallbackToken

  if (nextCartToken) {
    setCartCookies({
      cartId: resource.id,
      cartMarketKey: getCartMarketKey(market),
      cartToken: nextCartToken,
    })
  }
}

export function persistCompletedOrderAccess({
  orderIds,
  orderToken,
}: {
  orderIds: string[]
  orderToken?: string
}) {
  setCompletedOrderAccessCookie({
    orderIds,
    orderToken,
  })
}

export function persistCompletedOrderResourceAccess({
  fallbackToken,
  order,
  orderIds,
}: {
  fallbackToken?: string
  order: CheckoutResourceWithToken
  orderIds: string[]
}) {
  persistCompletedOrderAccess(
    buildCompletedOrderAccess({
      fallbackToken,
      order,
      orderIds,
    }),
  )
}
