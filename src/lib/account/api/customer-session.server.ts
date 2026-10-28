import '@tanstack/react-start/server-only'

import {
  clearCustomerAuthCookiesIfCurrentRefreshToken,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  setCustomerAuthCookies,
} from '@/lib/cookies/auth-cookie.server'
import {
  clearCartCookies,
  getCartCookieState,
  normalizeCartToken,
  setCartCookiesIfCurrentCartMatches,
} from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClient } from '@/lib/spree/client.server'
import { isSpreeErrorStatus, readSpreeErrorCode } from '@/lib/spree/errors'
import {
  assertCartResourceHasToken,
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { assertSpreeCartResourceMatchesMarketKey } from '@/lib/cart/utils/cart-market'
import { mapSpreeCartToSummary } from '@/lib/cart/mappers/cart.mapper'

import { assertCustomerResourceIsCustomer } from '../utils/customer-identity'
import { assertCustomerAuthResponse } from '../utils/customer-auth-response'
import { CustomerSessionRequiredError } from '../utils/customer-session-error'

export { CustomerSessionRequiredError } from '../utils/customer-session-error'

type CustomerSessionContext = {
  client: ReturnType<typeof getServerSpreeClient>
  token: string
}

export type CustomerSessionOptions = {
  client?: CustomerSessionContext['client']
}

const refreshInFlight = new Map<string, Promise<string | null>>()

function normalizeSessionToken(value: unknown) {
  const token = typeof value === 'string' ? value.trim() : undefined

  return token || undefined
}

function isInvalidRefreshCredentialError(error: unknown) {
  return (
    readSpreeErrorCode(error) === 'invalid_refresh_token' ||
    isSpreeErrorStatus(error, [401])
  )
}

async function refreshCustomerSession(
  client: ReturnType<typeof getServerSpreeClient>,
  expectedRefreshToken?: string | null,
) {
  const refreshToken = normalizeSessionToken(expectedRefreshToken)

  if (!refreshToken) {
    return null
  }

  const existingRefresh = refreshInFlight.get(refreshToken)

  if (existingRefresh) {
    return existingRefresh
  }

  const refresh = (async () => {
    try {
      const tokens = await client.auth.refresh({
        refresh_token: refreshToken,
      })
      assertCustomerAuthResponse(tokens)
      assertCustomerResourceIsCustomer(tokens.user)

      const nextAccessToken = normalizeSessionToken(tokens.token)
      const nextRefreshToken = normalizeSessionToken(tokens.refresh_token)

      if (!nextAccessToken || !nextRefreshToken) {
        return null
      }

      const persisted = setCustomerAuthCookies({
        expectedCurrentRefreshToken: refreshToken,
        refreshToken: nextRefreshToken,
        token: nextAccessToken,
      })

      return persisted ? nextAccessToken : null
    } catch (error) {
      if (isInvalidRefreshCredentialError(error)) {
        return null
      }

      throw error
    } finally {
      refreshInFlight.delete(refreshToken)
    }
  })()

  refreshInFlight.set(refreshToken, refresh)

  return refresh
}

export async function withCustomerSession<T>(
  action: (context: CustomerSessionContext) => Promise<T>,
  options: CustomerSessionOptions = {},
): Promise<T> {
  const expectedCurrentRefreshToken = getCustomerRefreshToken() ?? null
  const client = options.client ?? getServerSpreeClient()
  let token: string | null | undefined = getCustomerAccessToken()
  let refreshedBeforeAction = false

  if (!token) {
    token = await refreshCustomerSession(client, expectedCurrentRefreshToken)
    refreshedBeforeAction = Boolean(token)
  }

  if (!token) {
    clearCustomerAuthCookiesIfCurrentRefreshToken(expectedCurrentRefreshToken)
    throw new CustomerSessionRequiredError()
  }

  try {
    return await action({ client, token })
  } catch (error) {
    if (!isSpreeErrorStatus(error, [401])) {
      throw error
    }

    if (refreshedBeforeAction) {
      clearCustomerAuthCookiesIfCurrentRefreshToken(expectedCurrentRefreshToken)
      throw new CustomerSessionRequiredError()
    }

    const refreshedToken = await refreshCustomerSession(
      client,
      expectedCurrentRefreshToken,
    )

    if (!refreshedToken) {
      clearCustomerAuthCookiesIfCurrentRefreshToken(expectedCurrentRefreshToken)
      throw new CustomerSessionRequiredError()
    }

    try {
      return await action({
        client,
        token: refreshedToken,
      })
    } catch (retryError) {
      if (isSpreeErrorStatus(retryError, [401])) {
        clearCustomerAuthCookiesIfCurrentRefreshToken(
          expectedCurrentRefreshToken,
        )
        throw new CustomerSessionRequiredError()
      }

      throw retryError
    }
  }
}

async function associateGuestCartToCustomer(
  token: string,
  client = getServerSpreeClient(),
) {
  const { cartId, cartMarketKey, cartToken } = getCartCookieState()
  const normalizedCartToken = normalizeCartToken(cartToken)

  if (!cartId || !cartMarketKey || !normalizedCartToken) {
    return
  }

  try {
    assertCartResourceIsCart({ id: cartId })

    const cart = await client.carts.associate(cartId, {
      token,
      spreeToken: normalizedCartToken,
    })

    assertCartResourceHasToken(cart)
    assertCartResourceMatchesId(cart, cartId)
    assertSpreeCartResourceMatchesMarketKey(cart, cartMarketKey)
    mapSpreeCartToSummary(cart)

    setCartCookiesIfCurrentCartMatches(
      {
        cartId: cart.id,
        cartMarketKey,
        cartToken: cart.token,
      },
      cartId,
      normalizedCartToken,
    )
  } catch {
    // Best-effort only: failed association should not block login.
  }
}

export async function persistCustomerAuthSession({
  client,
  refreshToken,
  token,
}: {
  client?: CustomerSessionContext['client']
  refreshToken: string
  token: string
}) {
  const normalizedToken = normalizeSessionToken(token)
  const normalizedRefreshToken = normalizeSessionToken(refreshToken)

  if (!normalizedToken || !normalizedRefreshToken) {
    throw new CustomerSessionRequiredError()
  }

  const persisted = setCustomerAuthCookies({
    refreshToken: normalizedRefreshToken,
    token: normalizedToken,
  })

  if (!persisted) {
    throw new CustomerSessionRequiredError()
  }

  await associateGuestCartToCustomer(normalizedToken, client)

  return {
    refreshToken: normalizedRefreshToken,
    token: normalizedToken,
  }
}

export async function logoutCustomerOnServer({
  client = getServerSpreeClient(),
}: CustomerSessionOptions = {}) {
  const refreshToken = getCustomerRefreshToken()

  if (refreshToken) {
    try {
      await client.auth.logout({
        refresh_token: refreshToken,
      })
    } catch {
      // Cookie cleanup is the source of truth for the storefront session.
    }
  }

  const cleared = clearCustomerAuthCookiesIfCurrentRefreshToken(
    refreshToken ?? null,
  )

  if (cleared) {
    clearCartCookies()
  }

  return {
    success: true,
  }
}
