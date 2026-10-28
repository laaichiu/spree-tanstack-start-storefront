import { createServerFn } from '@tanstack/react-start'

import type { CustomerProfile } from '@/lib/account/contracts'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { marketInputSchema } from '@/lib/market/utils/market-input'
import { customerProfileUpdateRequestSchema } from '../validation/profile'

export const getCurrentCustomer = createServerFn({ method: 'GET' })
  .validator((data: unknown) => marketInputSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile | null> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { getCurrentCustomerProfile } =
      await import('./customer-profile.server')
    const market = await resolveServerMarket(data)

    return getCurrentCustomerProfile({
      moneyContext: market,
      client: getServerSpreeClientForMarket(market),
    })
  })

export const updateCustomerProfile = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerProfileUpdateRequestSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { updateCustomerProfileOnServer } =
      await import('./customer-profile.server')
    const { market, ...profile } = data
    const resolvedMarket = await resolveServerMarket(market)

    return updateCustomerProfileOnServer(profile, {
      moneyContext: resolvedMarket,
      client: getServerSpreeClientForMarket(resolvedMarket),
    })
  })

export const logoutCustomer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => marketInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { logoutCustomerOnServer } = await import('./customer-session.server')
    const market = await resolveServerMarket(data)

    return logoutCustomerOnServer({
      client: getServerSpreeClientForMarket(market),
    })
  })
