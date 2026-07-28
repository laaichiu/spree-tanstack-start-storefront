import { createServerFn } from '@tanstack/react-start'

import {
  customerPasswordResetConfirmSchema,
  customerPasswordResetSchema,
} from '@/lib/account/validation/password-reset'
import { customerRegisterSchema } from '@/lib/account/validation/register'
import {
  mapSpreeAuthUserToProfile,
  mapSpreeCustomerToProfile,
} from '@/lib/account/mappers/customer.mapper'
import type { CustomerProfile } from '@/lib/account/model/customer'

export const registerCustomer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerRegisterSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { getServerSpreeClient } = await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const client = getServerSpreeClient()
    const tokens = await client.customers.create({
      accepts_email_marketing: data.acceptsEmailMarketing,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      password: data.password,
      password_confirmation: data.passwordConfirmation,
    })

    await persistCustomerAuthSession({
      refreshToken: tokens.refresh_token,
      token: tokens.token,
    })

    try {
      return mapSpreeCustomerToProfile(
        await client.customer.get({
          token: tokens.token,
        }),
      )
    } catch {
      return mapSpreeAuthUserToProfile(tokens.user)
    }
  })

export const requestCustomerPasswordReset = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerPasswordResetSchema.parse(data))
  .handler(async ({ data }) => {
    const { getServerSpreeClient } = await import('@/lib/spree/client.server')

    return getServerSpreeClient().passwordResets.create({
      email: data.email,
    })
  })

export const resetCustomerPassword = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerPasswordResetConfirmSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { getServerSpreeClient } = await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const client = getServerSpreeClient()
    const tokens = await client.passwordResets.update(data.token, {
      password: data.password,
      password_confirmation: data.passwordConfirmation,
    })

    await persistCustomerAuthSession({
      refreshToken: tokens.refresh_token,
      token: tokens.token,
    })

    try {
      return mapSpreeCustomerToProfile(
        await client.customer.get({
          token: tokens.token,
        }),
      )
    } catch {
      return mapSpreeAuthUserToProfile(tokens.user)
    }
  })
