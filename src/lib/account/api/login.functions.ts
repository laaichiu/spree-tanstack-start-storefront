import { createServerFn } from '@tanstack/react-start'

import { customerLoginRequestSchema } from '@/lib/account/validation/login'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { assertCustomerResourceIsCustomer } from '../utils/customer-identity'
import { assertCustomerAuthResponse } from '../utils/customer-auth-response'
import { getAuthenticatedCustomerProfile } from './customer-authenticated-profile.server'

export const loginCustomer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerLoginRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const { market, ...credentials } = data
    const resolvedMarket = await resolveServerMarket(market)
    const client = getServerSpreeClientForMarket(resolvedMarket)
    const tokens = await client.auth.login(credentials)
    assertCustomerAuthResponse(tokens)
    assertCustomerResourceIsCustomer(tokens.user)

    const profile = await getAuthenticatedCustomerProfile({
      client,
      moneyContext: resolvedMarket,
      token: tokens.token,
      user: tokens.user,
    })

    await persistCustomerAuthSession({
      client,
      refreshToken: tokens.refresh_token,
      token: tokens.token,
    })

    return profile
  })
