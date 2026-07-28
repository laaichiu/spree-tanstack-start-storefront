import { createServerFn } from '@tanstack/react-start'

import {
  mapSpreeAuthUserToProfile,
  mapSpreeCustomerToProfile,
} from '@/lib/account/mappers/customer.mapper'
import { customerLoginSchema } from '@/lib/account/validation/login'

export const loginCustomer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerLoginSchema.parse(data))
  .handler(async ({ data }) => {
    const { getServerSpreeClient } = await import('@/lib/spree/client.server')
    const { persistCustomerAuthSession } =
      await import('./customer-session.server')
    const client = getServerSpreeClient()
    const tokens = await client.auth.login(data)

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
