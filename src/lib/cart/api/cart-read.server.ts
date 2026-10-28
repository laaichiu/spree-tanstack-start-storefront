import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart } from '@spree/sdk'

import {
  CustomerSessionRequiredError,
  withCustomerSession,
} from '@/lib/account/api/customer-session.server'
import {
  getCustomerAccessToken,
  getCustomerRefreshToken,
} from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookiesIfCurrentCartMatches,
  clearCartCookies,
  getCartCookieState,
  isCartCookieStateIncomplete,
} from '@/lib/cookies/cart-cookie.server'
import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
  isCartResourceIdentityMismatchError,
  isCartResourceTokenMissingError,
  isCartResourceTypeMismatchError,
} from '../utils/cart-identity'
import {
  assertCartOrderResourceMatchesCartHandle,
  isCartOrderResourceIdentityMismatchError,
} from '../utils/order-resource-identity'
import {
  assertSpreeCartResourceMatchesMarket,
  isCartMarketMismatchError,
  isCartMarketKeyCompatibleWithMarket,
  isSpreeCartResourceCompatibleWithMarket,
} from '../utils/cart-market'
import {
  CartOrderFallbackNotCompletedError,
  CartSessionMismatchError,
  isCartOrderFallbackNotCompletedError,
  isRecoverableCartResponseError,
} from '../utils/cart-errors'
import {
  assertCartListResponse,
  isCartListResponseTypeMismatchError,
} from '../utils/cart-list-response'
import {
  getCartRequestOptions,
  persistCartCookies,
  persistCartCookiesForNewCart,
} from './cart-request.server'

async function getCartOrderFallback({
  activeCartId,
  cartToken,
  client,
}: {
  activeCartId: string
  cartToken?: string
  client: ReturnType<typeof getServerSpreeClientForMarket>
}) {
  const requestOptions = getCartRequestOptions(cartToken)

  try {
    return await client.orders.get(activeCartId, undefined, requestOptions)
  } catch (error) {
    if (!requestOptions.token || !requestOptions.spreeToken) {
      throw error
    }

    try {
      return await client.orders.get(activeCartId, undefined, {
        spreeToken: requestOptions.spreeToken,
      })
    } catch {
      throw error
    }
  }
}

async function readAuthenticatedCartResource({
  cartId,
  client,
  market,
}: {
  cartId?: string
  client: ReturnType<typeof getServerSpreeClientForMarket>
  market: ResolvedMarket
}) {
  if (!getCustomerAccessToken() && !getCustomerRefreshToken()) {
    return null
  }

  try {
    return await withCustomerSession(
      async ({ client: sessionClient, token }) => {
        const response = await sessionClient.carts.list({ token })
        assertCartListResponse(response)
        response.data.forEach(assertCartResourceIsCart)

        const authenticatedCart = cartId
          ? response.data.find((candidate) => candidate.id === cartId)
          : response.data.find((candidate) =>
              isSpreeCartResourceCompatibleWithMarket(candidate, market),
            )

        if (!authenticatedCart) {
          return null
        }

        assertSpreeCartResourceMatchesMarket(authenticatedCart, market)

        return authenticatedCart
      },
      { client },
    )
  } catch (error) {
    if (error instanceof CustomerSessionRequiredError) {
      return null
    }

    throw error
  }
}

function projectAuthenticatedCart({
  authenticatedCart,
  cartId,
  currentCartId,
  currentCartToken,
  market,
}: {
  authenticatedCart: SpreeCart
  cartId?: string
  currentCartId?: string
  currentCartToken?: string
  market: ResolvedMarket
}) {
  const normalizedCart = mapSpreeCartToSummary(authenticatedCart)

  if (cartId) {
    const didPersistCartCookies = persistCartCookies(
      market,
      authenticatedCart,
      cartId,
      currentCartToken,
    )

    if (didPersistCartCookies === false) {
      throw new CartSessionMismatchError()
    }
  } else if (currentCartId) {
    const didPersistCartCookies = persistCartCookiesForNewCart(
      market,
      authenticatedCart,
      authenticatedCart.id,
      currentCartId,
      currentCartToken,
    )

    if (didPersistCartCookies === false) {
      throw new CartSessionMismatchError()
    }
  } else {
    const didPersistCartCookies = persistCartCookiesForNewCart(
      market,
      authenticatedCart,
      authenticatedCart.id,
    )

    if (didPersistCartCookies === false) {
      throw new CartSessionMismatchError()
    }
  }

  return normalizedCart
}

async function readAuthenticatedCart({
  cartId,
  client,
  currentCartId,
  currentCartToken,
  market,
}: {
  cartId?: string
  client: ReturnType<typeof getServerSpreeClientForMarket>
  currentCartId?: string
  currentCartToken?: string
  market: ResolvedMarket
}) {
  const authenticatedCart = await readAuthenticatedCartResource({
    cartId,
    client,
    market,
  })

  return authenticatedCart
    ? projectAuthenticatedCart({
        authenticatedCart,
        cartId,
        currentCartId,
        currentCartToken,
        market,
      })
    : null
}

async function recoverCartAfterReadFailure({
  activeCartId,
  cartCookieId,
  cartId,
  cartToken,
  client,
  error,
  market,
}: {
  activeCartId: string
  cartCookieId?: string
  cartId?: string
  cartToken?: string
  client: ReturnType<typeof getServerSpreeClientForMarket>
  error: unknown
  market: ResolvedMarket
}) {
  if (isRecoverableCartResponseError(error)) {
    let authenticatedCart: SpreeCart | null = null

    try {
      authenticatedCart = await readAuthenticatedCartResource({
        cartId,
        client,
        market,
      })
    } catch (fallbackError) {
      if (
        isCartResourceIdentityMismatchError(fallbackError) ||
        isCartResourceTypeMismatchError(fallbackError) ||
        isCartResourceTokenMissingError(fallbackError) ||
        isCartListResponseTypeMismatchError(fallbackError)
      ) {
        throw fallbackError
      }

      if (isCartMarketMismatchError(fallbackError)) {
        throw fallbackError
      }

      // Fall through to the order lookup below only for recoverable cart reads.
    }

    if (authenticatedCart) {
      return projectAuthenticatedCart({
        authenticatedCart,
        cartId,
        currentCartId: activeCartId,
        currentCartToken: cartToken,
        market,
      })
    }
  }

  try {
    const order = await getCartOrderFallback({
      activeCartId,
      cartToken,
      client,
    })

    assertCartOrderResourceMatchesCartHandle(order, activeCartId)
    assertSpreeCartResourceMatchesMarket(order, market)

    if (!isSpreeCompletedOrder(order)) {
      throw new CartOrderFallbackNotCompletedError()
    }

    // The Store API order lookup resolves the completed result behind the
    // cart handle. A completed Order is no longer an active cart and must
    // not be projected into editable cart query state.
    if (!cartId || cartCookieId === cartId) {
      clearCartCookiesIfCurrentCartMatches(activeCartId, cartToken)
    }

    return null
  } catch (orderError) {
    if (
      isCartOrderResourceIdentityMismatchError(orderError) ||
      isCartOrderFallbackNotCompletedError(orderError) ||
      isCartMarketMismatchError(orderError)
    ) {
      throw orderError
    }

    if (!cartId && isRecoverableCartResponseError(error)) {
      clearCartCookiesIfCurrentCartMatches(activeCartId, cartToken)
      return null
    }

    throw error
  }
}

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
  const hasIncompleteState = isCartCookieStateIncomplete({
    cartId: cookieCartId,
    cartMarketKey,
    cartToken,
  })

  if (hasIncompleteState) {
    clearCartCookies()

    return null
  }

  if (!activeCartId) {
    return readAuthenticatedCart({
      client: getServerSpreeClientForMarket(market),
      market,
    })
  }

  if (!cartId && !isCartMarketKeyCompatibleWithMarket(cartMarketKey, market)) {
    return null
  }

  const client = getServerSpreeClientForMarket(market)

  assertCartResourceIsCart({ id: activeCartId })

  let cart: SpreeCart

  try {
    cart = await client.carts.get(activeCartId, {
      ...getCartRequestOptions(cartToken),
    })
  } catch (error) {
    if (
      isCartResourceIdentityMismatchError(error) ||
      isCartResourceTypeMismatchError(error) ||
      isCartResourceTokenMissingError(error)
    ) {
      throw error
    }

    return recoverCartAfterReadFailure({
      activeCartId,
      cartCookieId: cookieCartId,
      cartId,
      cartToken,
      client,
      error,
      market,
    })
  }

  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, activeCartId)

  if (!isSpreeCartResourceCompatibleWithMarket(cart, market)) {
    if (!cartId || cookieCartId === cartId) {
      clearCartCookiesIfCurrentCartMatches(activeCartId, cartToken)
    }

    if (cartId) {
      assertSpreeCartResourceMatchesMarket(cart, market)
    }

    return null
  }

  const normalizedCart = mapSpreeCartToSummary(cart)

  const didPersistCartCookies = persistCartCookies(
    market,
    cart,
    activeCartId,
    cartToken,
  )

  if (didPersistCartCookies === false) {
    throw new CartSessionMismatchError()
  }

  return normalizedCart
}
