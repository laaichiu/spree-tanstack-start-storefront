import '@tanstack/react-start/server-only'

import {
  clearCustomerAuthCookies,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  setCustomerAuthCookies,
} from '@/lib/cookies/auth-cookie.server'
import {
  getCartCookieState,
  setCartCookies,
} from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClient } from '@/lib/spree/client.server'
import { isSpreeErrorStatus, readSpreeErrorCode } from '@/lib/spree/errors'

import { mapSpreeCustomerToProfile } from '../mappers/customer.mapper'
import type { CustomerProfile } from '../model/customer'
import type { CustomerProfileUpdateInput } from '../validation/profile'

export class CustomerSessionRequiredError extends Error {
  constructor() {
    super('Customer session is required.')
    this.name = 'CustomerSessionRequiredError'
  }
}

type CustomerSessionContext = {
  client: ReturnType<typeof getServerSpreeClient>
  token: string
}

const refreshInFlight = new Map<string, Promise<string | null>>()

function isInvalidRefreshCredentialError(error: unknown) {
  return (
    readSpreeErrorCode(error) === 'invalid_refresh_token' ||
    isSpreeErrorStatus(error, [401, 403])
  )
}

async function refreshCustomerSession(
  client: ReturnType<typeof getServerSpreeClient>,
) {
  const refreshToken = getCustomerRefreshToken()

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

      setCustomerAuthCookies({
        refreshToken: tokens.refresh_token,
        token: tokens.token,
      })

      return tokens.token
    } catch (error) {
      if (isInvalidRefreshCredentialError(error)) {
        clearCustomerAuthCookies()
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
): Promise<T> {
  const client = getServerSpreeClient()
  let token: string | null | undefined = getCustomerAccessToken()

  if (!token) {
    token = await refreshCustomerSession(client)
  }

  if (!token) {
    throw new CustomerSessionRequiredError()
  }

  try {
    return await action({ client, token })
  } catch (error) {
    if (!isSpreeErrorStatus(error, [401, 403])) {
      throw error
    }

    const refreshedToken = await refreshCustomerSession(client)

    if (!refreshedToken) {
      throw new CustomerSessionRequiredError()
    }

    try {
      return await action({
        client,
        token: refreshedToken,
      })
    } catch (retryError) {
      if (isSpreeErrorStatus(retryError, [401, 403])) {
        clearCustomerAuthCookies()
        throw new CustomerSessionRequiredError()
      }

      throw retryError
    }
  }
}

async function associateGuestCartToCustomer(token: string) {
  const { cartId, cartMarketKey, cartToken } = getCartCookieState()

  if (!cartId || !cartToken) {
    return
  }

  try {
    const cart = await getServerSpreeClient().carts.associate(cartId, {
      token,
      spreeToken: cartToken,
    })

    setCartCookies({
      cartId: cart.id,
      cartMarketKey,
      cartToken: cart.token,
    })
  } catch {
    // Best-effort only: failed association should not block login.
  }
}

export async function persistCustomerAuthSession({
  refreshToken,
  token,
}: {
  refreshToken: string
  token: string
}) {
  setCustomerAuthCookies({
    refreshToken,
    token,
  })

  await associateGuestCartToCustomer(token)
}

export async function getCurrentCustomerProfile(): Promise<CustomerProfile | null> {
  try {
    return await withCustomerSession(async ({ client, token }) => {
      const customer = await client.customer.get({ token })

      return mapSpreeCustomerToProfile(customer)
    })
  } catch (error) {
    if (error instanceof CustomerSessionRequiredError) {
      return null
    }

    throw error
  }
}

export async function updateCustomerProfileOnServer(
  data: CustomerProfileUpdateInput,
): Promise<CustomerProfile> {
  return withCustomerSession(async ({ client, token }) => {
    const currentCustomer = await client.customer.get({ token })
    const shouldUpdateEmail = currentCustomer.email !== data.email
    const customer = await client.customer.update(
      {
        accepts_email_marketing: data.acceptsEmailMarketing,
        ...(shouldUpdateEmail ? { email: data.email } : {}),
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      },
      {
        token,
      },
    )

    return mapSpreeCustomerToProfile(customer)
  })
}

export async function logoutCustomerOnServer() {
  const refreshToken = getCustomerRefreshToken()

  if (refreshToken) {
    try {
      await getServerSpreeClient().auth.logout({
        refresh_token: refreshToken,
      })
    } catch {
      // Cookie cleanup is the source of truth for the storefront session.
    }
  }

  clearCustomerAuthCookies()

  return {
    success: true,
  }
}
