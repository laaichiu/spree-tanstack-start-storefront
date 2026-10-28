import { createServerFn } from '@tanstack/react-start'

import {
  customerPasswordResetConfirmRequestSchema,
  customerPasswordResetRequestSchema,
} from '@/lib/account/validation/password-reset'
import { customerRegisterRequestSchema } from '@/lib/account/validation/register'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { CustomerProfile } from '@/lib/account/contracts'
import { assertCustomerResourceIsCustomer } from '../utils/customer-identity'
import { assertCustomerAuthResponse } from '../utils/customer-auth-response'
import { getAuthenticatedCustomerProfile } from './customer-authenticated-profile.server'

export const registerCustomer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerRegisterRequestSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const { market, ...registration } = data
    const resolvedMarket = await resolveServerMarket(market)
    const client = getServerSpreeClientForMarket(resolvedMarket)
    const tokens = await client.customers.create({
      accepts_email_marketing: registration.acceptsEmailMarketing,
      email: registration.email,
      first_name: registration.firstName,
      last_name: registration.lastName,
      password: registration.password,
      password_confirmation: registration.passwordConfirmation,
    })
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

export const requestCustomerPasswordReset = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerPasswordResetRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { market, ...request } = data
    const resolvedMarket = await resolveServerMarket(market)

    await getServerSpreeClientForMarket(resolvedMarket).passwordResets.create({
      email: request.email,
    })

    return { success: true as const }
  })

export const resetCustomerPassword = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    customerPasswordResetConfirmRequestSchema.parse(data),
  )
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const { market, ...reset } = data
    const resolvedMarket = await resolveServerMarket(market)
    const client = getServerSpreeClientForMarket(resolvedMarket)
    const tokens = await client.passwordResets.update(reset.token, {
      password: reset.password,
      password_confirmation: reset.passwordConfirmation,
    })
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
