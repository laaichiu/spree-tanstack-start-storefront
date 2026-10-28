import type { MoneyDisplayContext } from '@/lib/runtime/spree-money'
import '@tanstack/react-start/server-only'

import type { AuthTokens, Client } from '@spree/sdk'

import type { CustomerProfile } from '@/lib/account/contracts'
import {
  mapSpreeAuthUserToProfile,
  mapSpreeCustomerToProfile,
} from '@/lib/account/mappers/customer.mapper'

import { assertCustomerResourceMatchesId } from '../utils/customer-identity'
import { assertCustomerProfileResponse } from '../utils/customer-profile-response'

export async function getAuthenticatedCustomerProfile({
  client,
  token,
  moneyContext,
  user,
}: {
  client: Pick<Client, 'customer'>
  token: string
  moneyContext: MoneyDisplayContext
  user: AuthTokens['user']
}): Promise<CustomerProfile> {
  let customer

  try {
    customer = await client.customer.get({ token: token.trim() })
  } catch {
    return mapSpreeAuthUserToProfile(user)
  }

  assertCustomerResourceMatchesId(customer, user.id)
  assertCustomerProfileResponse(customer)

  return mapSpreeCustomerToProfile(customer, moneyContext)
}
