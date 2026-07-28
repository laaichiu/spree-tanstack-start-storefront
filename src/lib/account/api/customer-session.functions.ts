import { createServerFn } from '@tanstack/react-start'

import type { CustomerProfile } from '../model/customer'
import { customerProfileUpdateSchema } from '../validation/profile'

export const getCurrentCustomer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CustomerProfile | null> => {
    const { getCurrentCustomerProfile } =
      await import('./customer-session.server')

    return getCurrentCustomerProfile()
  },
)

export const updateCustomerProfile = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerProfileUpdateSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const { updateCustomerProfileOnServer } =
      await import('./customer-session.server')

    return updateCustomerProfileOnServer(data)
  })

export const logoutCustomer = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { logoutCustomerOnServer } = await import('./customer-session.server')

    return logoutCustomerOnServer()
  },
)
