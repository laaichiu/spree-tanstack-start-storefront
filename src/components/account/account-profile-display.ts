import type { CustomerProfile } from '@/lib/account/contracts'

export function getCustomerDisplayName(
  customer: Pick<CustomerProfile, 'firstName' | 'lastName'>,
): string | undefined {
  const name = [customer.firstName, customer.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(' ')

  return name || undefined
}
