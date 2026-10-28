import { getAddressLines } from '@/lib/core/address'
import type { AddressDisplay } from '@/lib/core/address'
import type { CustomerAddress, OrderAddress } from '@/lib/account/contracts'

export type CustomerAddressDisplay = AddressDisplay & {
  id: string
  isDefaultBilling: boolean
  isDefaultShipping: boolean
}

export function getCustomerAddressDisplay(
  address: CustomerAddress,
): CustomerAddressDisplay {
  return {
    id: address.id,
    fullName: address.fullName,
    isDefaultBilling: address.isDefaultBilling,
    isDefaultShipping: address.isDefaultShipping,
    lines: getAddressLines(address),
  }
}

export function getOrderAddressDisplay(
  address: OrderAddress | null,
): AddressDisplay | null {
  return address
    ? {
        fullName: address.fullName,
        lines: getAddressLines(address),
      }
    : null
}
