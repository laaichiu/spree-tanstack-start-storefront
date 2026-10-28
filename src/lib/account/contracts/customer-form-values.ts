import type { CustomerProfile } from './customer'

export type CustomerProfileFormValues = {
  acceptsEmailMarketing: boolean
  email: string
  firstName: string
  lastName: string
  phone: string
}

export function getCustomerProfileFormDefaults(
  customer: CustomerProfile,
): CustomerProfileFormValues {
  return {
    acceptsEmailMarketing: customer.acceptsEmailMarketing,
    email: customer.email,
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    phone: customer.phone ?? '',
  }
}
