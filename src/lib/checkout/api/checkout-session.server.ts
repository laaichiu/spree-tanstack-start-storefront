import '@tanstack/react-start/server-only'

import type { Client, RequestOptions } from '@spree/sdk'

import { withCustomerSession } from '@/lib/account/api/customer-session.server'
import type { ResolvedMarket } from '@/lib/core/market'
import {
  getCustomerAccessToken,
  getCustomerRefreshToken,
} from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookies,
  getCartCookieState,
  isCartCookieStateIncomplete,
  normalizeCartToken,
  setCartCookiesIfCurrentCart,
  setCartCookiesIfCurrentCartMatches,
} from '@/lib/cookies/cart-cookie.server'
import {
  setCompletedOrderAccessCookie,
  setCompletedOrderGroupAccessCookie,
} from '@/lib/cookies/completed-order-cookie.server'
import {
  assertSpreeCartResourceMatchesMarket,
  CartMarketMismatchError,
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
} from '@/lib/cart/utils/cart-market'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { buildCompletedOrderAccess } from '@/lib/checkout/utils/completion/completed-order-access'
import { isSpreeErrorStatus } from '@/lib/spree/errors'
import { mapSpreeCheckoutToOrder } from '../mappers/checkout.mapper'

export type CheckoutMarket = Pick<
  ResolvedMarket,
  'country' | 'currencyCode' | 'locale' | 'marketId'
>

const SAVED_PAYMENT_METHOD_SESSION_ERROR =
  'Sign in again to use a saved payment method, or choose a new payment method.'
const CHECKOUT_CART_SESSION_MISMATCH_MESSAGE =
  'This checkout session no longer matches the active cart.'

export class CheckoutCartSessionMismatchError extends Error {
  constructor() {
    super(CHECKOUT_CART_SESSION_MISMATCH_MESSAGE)
    this.name = 'CheckoutCartSessionMismatchError'
  }
}

type CheckoutResourceWithToken = {
  currency?: string | null
  id: string
  market_id?: string | null
  token?: unknown
}

function readTokenFromResource(resource: { token?: unknown }) {
  const token = typeof resource.token === 'string' ? resource.token.trim() : ''

  return token || undefined
}

export function getCheckoutResourceToken(
  resource: { token?: unknown },
  fallbackToken?: string,
) {
  return (
    readTokenFromResource(resource) ??
    readTokenFromResource({ token: fallbackToken })
  )
}

export function getCheckoutCartRequestOptions(
  cartToken?: string,
  customerToken?: string,
) {
  const token =
    customerToken === undefined
      ? getCustomerAccessToken()
      : customerToken.trim()
  const normalizedCartToken = cartToken?.trim()

  return {
    ...(normalizedCartToken ? { spreeToken: normalizedCartToken } : {}),
    ...(token ? { token } : {}),
  }
}

export function withCheckoutCustomerSession<T>({
  client,
  operation,
}: {
  client: Client
  operation: (customerToken?: string) => Promise<T>
}) {
  // Customer-owned cart addresses need authenticated writes; guests keep the
  // cart token path and never fall back after an auth session has started.
  if (!getCustomerAccessToken()?.trim() && !getCustomerRefreshToken()?.trim()) {
    return operation()
  }

  return withCustomerSession(({ token }) => operation(token), { client })
}

export async function requireCheckoutCustomerCartAssociation({
  cartId,
  cartToken,
  client,
  customerToken,
  market,
}: {
  cartId: string
  cartToken?: string
  client: Pick<Client, 'carts'>
  customerToken?: string
  market: CheckoutMarket
}): Promise<RequestOptions> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken, customerToken)

  if (!requestOptions.spreeToken || !requestOptions.token) {
    throw new Error(SAVED_PAYMENT_METHOD_SESSION_ERROR)
  }

  const cart = await (async () => {
    try {
      return await client.carts.associate(cartId, requestOptions)
    } catch (error) {
      if (isSpreeErrorStatus(error, [401, 403])) {
        throw error
      }

      throw new Error(SAVED_PAYMENT_METHOD_SESSION_ERROR)
    }
  })()

  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, cartId)
  assertSpreeCartResourceMatchesMarket(cart, market)
  mapSpreeCheckoutToOrder(cart, { locale: market.locale })
  const nextCartToken = getCheckoutResourceToken(cart, cartToken)

  const didPersistCartCookies = persistCheckoutCartCookies(cart, market, {
    expectedCartId: cartId,
    expectedCurrentCartToken: cartToken,
    fallbackToken: nextCartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }

  return getCheckoutCartRequestOptions(nextCartToken, customerToken)
}

export function getCheckoutCartCookieStateForMarket(
  market: CheckoutMarket,
  expectedCartId?: string,
) {
  const state = getCartCookieState()

  if (isCartCookieStateIncomplete(state)) {
    clearCartCookies()
    throw new CheckoutCartSessionMismatchError()
  }

  if (state.cartId) {
    assertCartResourceIsCart({ id: state.cartId })
  }

  if (expectedCartId && state.cartId && state.cartId !== expectedCartId) {
    throw new CheckoutCartSessionMismatchError()
  }

  if (!isCartMarketKeyCompatibleWithMarket(state.cartMarketKey, market)) {
    if (expectedCartId && state.cartId === expectedCartId) {
      clearCartCookies()
    }

    throw new CartMarketMismatchError()
  }

  return state
}

export function clearCheckoutCartCookiesIfOwnedByCart(
  cartId: string,
  cartCookieId?: string,
  cartCookieToken?: string,
) {
  if (cartCookieId !== undefined && cartCookieId !== cartId) {
    return
  }

  const currentState = getCartCookieState()
  const activeCartId = currentState.cartId

  if (activeCartId && activeCartId !== cartId) {
    return
  }

  if (
    activeCartId === cartId &&
    cartCookieToken !== undefined &&
    currentState.cartToken !== normalizeCartToken(cartCookieToken)
  ) {
    return
  }

  clearCartCookies()
}

export function requireCheckoutCartCookieStateForCart(
  market: CheckoutMarket,
  expectedCartId: string,
) {
  const state = getCheckoutCartCookieStateForMarket(market, expectedCartId)

  if (state.cartId !== expectedCartId) {
    throw new CheckoutCartSessionMismatchError()
  }

  return state
}

export async function assertCheckoutCartMatchesMarket({
  cartId,
  cartToken,
  client,
  customerToken,
  market,
}: {
  cartId: string
  cartToken?: string
  client: Pick<Client, 'carts'>
  customerToken?: string
  market: CheckoutMarket
}): Promise<string | undefined> {
  const cart = await client.carts.get(
    cartId,
    customerToken === undefined
      ? getCheckoutCartRequestOptions(cartToken)
      : getCheckoutCartRequestOptions(cartToken, customerToken),
  )

  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, cartId)
  assertSpreeCartResourceMatchesMarket(cart, market)
  mapSpreeCheckoutToOrder(cart, { locale: market.locale })
  const nextCartToken = getCheckoutResourceToken(cart, cartToken)

  const didPersistCartCookies = persistCheckoutCartCookies(cart, market, {
    expectedCartId: cartId,
    expectedCurrentCartToken: cartToken,
    fallbackToken: nextCartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }

  return nextCartToken
}

type PersistCheckoutCartCookiesOptions = {
  cartIdOverride?: string
  expectedCartId?: string
  expectedCurrentCartToken?: string
  fallbackToken?: string
}

export function persistCheckoutCartCookies(
  resource: CheckoutResourceWithToken,
  market: CheckoutMarket,
  {
    cartIdOverride,
    expectedCartId,
    expectedCurrentCartToken,
    fallbackToken,
  }: PersistCheckoutCartCookiesOptions = {},
) {
  if (expectedCartId) {
    assertCartResourceIsCart(resource)
    assertCartResourceMatchesId(resource, expectedCartId)
  }

  assertSpreeCartResourceMatchesMarket(resource, market)

  const nextCartToken = getCheckoutResourceToken(resource, fallbackToken)
  const activeCartId = cartIdOverride ?? resource.id

  if (!nextCartToken) {
    return false
  }

  const cookies = {
    cartId: activeCartId,
    cartMarketKey: getCartMarketKey(market),
    cartToken: nextCartToken,
  }

  const expectedOwnerId = expectedCartId ?? cartIdOverride

  if (expectedOwnerId) {
    return setCartCookiesIfCurrentCartMatches(
      cookies,
      expectedOwnerId,
      expectedCurrentCartToken,
    )
  }

  return setCartCookiesIfCurrentCart(cookies, activeCartId)
}

export function persistCompletedOrderAccess({
  expectedCurrentAccessToken,
  orderIds,
  orderToken,
}: {
  expectedCurrentAccessToken?: string | null
  orderIds: string[]
  orderToken?: string
}) {
  setCompletedOrderAccessCookie({
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
    orderIds,
    orderToken,
  })
}

export function persistCompletedOrderResourceAccess({
  fallbackToken,
  order,
  orderIds,
  expectedCurrentAccessToken,
}: {
  fallbackToken?: string
  order: CheckoutResourceWithToken
  orderIds: string[]
  expectedCurrentAccessToken?: string | null
}) {
  persistCompletedOrderAccess({
    ...buildCompletedOrderAccess({
      fallbackToken,
      order,
      orderIds,
    }),
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
  })
}

export function persistCompletedOrderGroupResourceAccess({
  cartId,
  fallbackToken,
  groupId,
  groupNumber,
  orderIds,
  expectedCurrentAccessToken,
}: {
  cartId: string
  fallbackToken?: string
  groupId: string
  groupNumber: string
  orderIds: string[]
  expectedCurrentAccessToken?: string | null
}) {
  const accessOrderIds = [cartId, groupId, ...orderIds]

  persistCompletedOrderAccess({
    orderIds: accessOrderIds,
    orderToken: fallbackToken,
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
  })
  setCompletedOrderGroupAccessCookie({
    groupId,
    number: groupNumber,
    orderIds,
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
  })
}
