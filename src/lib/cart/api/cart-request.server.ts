import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart, Client } from '@spree/sdk'

import {
  CustomerSessionRequiredError,
  withCustomerSession,
} from '@/lib/account/api/customer-session.server'
import { assertCustomerResourceIsCustomer } from '@/lib/account/utils/customer-identity'
import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookies,
  getCartCookieState,
  isCartCookieStateIncomplete,
  setCartCookiesIfCurrentCart,
  setCartCookiesIfCurrentCartMatches,
} from '@/lib/cookies/cart-cookie.server'
import type { ResolvedMarket } from '@/lib/core/market'
import { mapSpreeCartToSummary } from '../mappers/cart.mapper'

import {
  assertSpreeCartResourceMatchesMarket,
  CartMarketMismatchError,
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
} from '../utils/cart-market'
import {
  assertCartResourceHasToken,
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '../utils/cart-identity'
import { CartSessionMismatchError } from '../utils/cart-errors'

export function getCartRequestOptions(cartToken?: string) {
  const token = getCustomerAccessToken()
  const normalizedCartToken = cartToken?.trim()

  return {
    ...(normalizedCartToken ? { spreeToken: normalizedCartToken } : {}),
    ...(token ? { token } : {}),
  }
}

export async function createCartForCurrentSession(
  client: Client,
  market: ResolvedMarket,
) {
  let cart: SpreeCart

  try {
    cart = await withCustomerSession(
      async ({ client: sessionClient, token }) => {
        // Cart creation is optional-auth on Spree. Validate the customer
        // token through a required-auth resource first; otherwise an expired
        // JWT can silently create a guest cart instead of refreshing the
        // current customer session.
        const customer = await sessionClient.customer.get({ token })
        assertCustomerResourceIsCustomer(customer)

        return sessionClient.carts.create(undefined, { token })
      },
      { client },
    )
  } catch (error) {
    if (!(error instanceof CustomerSessionRequiredError)) {
      throw error
    }

    // No usable customer session remains. Make the guest intent explicit so
    // a stale access-token cookie is never sent to the optional-auth endpoint.
    cart = await client.carts.create(undefined, {})
  }

  assertCartResourceIsCart(cart)
  assertSpreeCartResourceMatchesMarket(cart, market)
  assertCartResourceHasToken(cart)
  mapSpreeCartToSummary(cart)

  return cart
}

export function getRequiredCartCookieStateForMarket(market: ResolvedMarket) {
  const { cartId, cartMarketKey, cartToken } = getCartCookieState()
  const hasIncompleteState = isCartCookieStateIncomplete({
    cartId,
    cartMarketKey,
    cartToken,
  })

  if (!cartId || !cartToken || hasIncompleteState) {
    if (hasIncompleteState) {
      clearCartCookies()
    }

    throw new Error('Cart is not available')
  }

  assertCartResourceIsCart({ id: cartId })

  if (!isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)) {
    throw new CartMarketMismatchError()
  }

  return {
    cartId,
    cartToken,
  }
}

export async function assertCartMutationCartMatchesMarket({
  cartId,
  cartToken,
  client,
  market,
}: {
  cartId: string
  cartToken: string
  client: Pick<Client, 'carts'>
  market: ResolvedMarket
}): Promise<string> {
  const cart = await client.carts.get(cartId, getCartRequestOptions(cartToken))

  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, cartId)
  assertSpreeCartResourceMatchesMarket(cart, market)
  assertCartResourceHasToken(cart)
  mapSpreeCartToSummary(cart)

  const didPersistCartCookies = persistCartCookies(
    market,
    cart,
    cartId,
    cartToken,
  )

  if (didPersistCartCookies === false) {
    throw new CartSessionMismatchError()
  }

  return cart.token || cartToken
}

export function persistCartCookies(
  market: ResolvedMarket,
  cart: Pick<SpreeCart, 'currency' | 'id' | 'market_id' | 'token'>,
  expectedCartId?: string,
  expectedCurrentCartToken?: string,
) {
  assertCartResourceIsCart(cart)

  if (expectedCartId) {
    assertCartResourceMatchesId(cart, expectedCartId)
  }

  assertSpreeCartResourceMatchesMarket(cart, market)
  assertCartResourceHasToken(cart)

  const cookies = {
    cartId: cart.id,
    cartMarketKey: getCartMarketKey(market),
    cartToken: cart.token,
  }

  if (expectedCartId || expectedCurrentCartToken !== undefined) {
    return setCartCookiesIfCurrentCartMatches(
      cookies,
      expectedCartId ?? cart.id,
      expectedCurrentCartToken,
    )
  }

  return setCartCookiesIfCurrentCart(cookies, cart.id)
}

export function persistCartCookiesForNewCart(
  market: ResolvedMarket,
  cart: Pick<SpreeCart, 'currency' | 'id' | 'market_id' | 'token'>,
  requestedCartId: string,
  expectedCurrentCartId?: string,
  expectedCurrentCartToken?: string,
) {
  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, requestedCartId)
  assertSpreeCartResourceMatchesMarket(cart, market)
  assertCartResourceHasToken(cart)

  const cookies = {
    cartId: cart.id,
    cartMarketKey: getCartMarketKey(market),
    cartToken: cart.token,
  }

  if (expectedCurrentCartToken === undefined) {
    return setCartCookiesIfCurrentCartMatches(cookies, expectedCurrentCartId)
  }

  return setCartCookiesIfCurrentCartMatches(
    cookies,
    expectedCurrentCartId,
    expectedCurrentCartToken,
  )
}
