import type { MoneyDisplayContext } from '@/lib/runtime/spree-money'
import '@tanstack/react-start/server-only'

import type { CustomerProfile } from '@/lib/account/contracts'

import { mapSpreeCustomerToProfile } from '../mappers/customer.mapper'
import type { CustomerSessionOptions } from './customer-session.server'
import type { CustomerProfileUpdateInput } from '../validation/profile'
import {
  CustomerSessionRequiredError,
  withCustomerSession,
} from './customer-session.server'
import {
  assertCustomerResourceIsCustomer,
  assertCustomerResourceMatchesId,
} from '../utils/customer-identity'
import { assertCustomerProfileResponse } from '../utils/customer-profile-response'

type CustomerProfileOptions = CustomerSessionOptions & {
  moneyContext: MoneyDisplayContext
}

export async function getCurrentCustomerProfile({
  moneyContext,
  ...options
}: CustomerProfileOptions): Promise<CustomerProfile | null> {
  try {
    return await withCustomerSession(async ({ client, token }) => {
      const customer = await client.customer.get({ token })
      assertCustomerResourceIsCustomer(customer)
      assertCustomerProfileResponse(customer)

      return mapSpreeCustomerToProfile(customer, moneyContext)
    }, options)
  } catch (error) {
    if (error instanceof CustomerSessionRequiredError) {
      return null
    }

    throw error
  }
}

export async function updateCustomerProfileOnServer(
  data: CustomerProfileUpdateInput,
  { moneyContext, ...options }: CustomerProfileOptions,
): Promise<CustomerProfile> {
  return withCustomerSession(async ({ client, token }) => {
    const currentCustomer = await client.customer.get({ token })
    assertCustomerResourceIsCustomer(currentCustomer)
    assertCustomerProfileResponse(currentCustomer)
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
    assertCustomerResourceMatchesId(customer, currentCustomer.id)
    assertCustomerProfileResponse(customer)

    return mapSpreeCustomerToProfile(customer, moneyContext)
  }, options)
}
