import type { AuthTokens, Customer } from '@spree/sdk'

import type { CustomerProfile } from '@/lib/account/model/customer'

export function mapSpreeCustomerToProfile(customer: Customer): CustomerProfile {
  return {
    acceptsEmailMarketing: customer.accepts_email_marketing,
    availableStoreCreditTotal: customer.available_store_credit_total,
    displayAvailableStoreCreditTotal:
      customer.display_available_store_credit_total,
    email: customer.email,
    firstName: customer.first_name,
    id: customer.id,
    lastName: customer.last_name,
    phone: customer.phone,
  }
}

export function mapSpreeAuthUserToProfile(
  user: AuthTokens['user'],
): CustomerProfile {
  return {
    acceptsEmailMarketing: false,
    availableStoreCreditTotal: null,
    displayAvailableStoreCreditTotal: null,
    email: user.email,
    firstName: user.first_name,
    id: user.id,
    lastName: user.last_name,
    phone: null,
  }
}
