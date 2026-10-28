import { getAddressLines } from '@/lib/core/address'
import type { CustomerAddress } from '@/lib/account/contracts'

export type CheckoutSavedAddressDisplay = {
  description: string
  id: string
  label: string
}

export function getCheckoutSavedAddressDisplays(
  addresses: readonly CustomerAddress[],
  fallbackLabel: string,
): CheckoutSavedAddressDisplay[] {
  return addresses.map((address) => ({
    description: getAddressLines(address).join(', '),
    id: address.id,
    label: address.fullName || fallbackLabel,
  }))
}
