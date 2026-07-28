import type { Address } from '@spree/sdk'

import type { CustomerAddress } from '@/lib/account/model/customer-address'

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim() ?? ''

  return normalized || null
}

export function mapSpreeAddressToCustomerAddress(
  address: Address,
): CustomerAddress {
  return {
    address1: normalizeNullableText(address.address1),
    address2: normalizeNullableText(address.address2),
    city: normalizeNullableText(address.city),
    company: normalizeNullableText(address.company),
    countryIso: address.country_iso,
    countryName: address.country_name,
    firstName: normalizeNullableText(address.first_name),
    fullName: address.full_name,
    id: address.id,
    isDefaultBilling: address.is_default_billing,
    isDefaultShipping: address.is_default_shipping,
    lastName: normalizeNullableText(address.last_name),
    phone: normalizeNullableText(address.phone),
    postalCode: normalizeNullableText(address.postal_code),
    quickCheckout: address.quick_checkout,
    stateAbbr: normalizeNullableText(address.state_abbr),
    stateName: normalizeNullableText(address.state_name),
    stateText: normalizeNullableText(address.state_text),
  }
}

export function mapSpreeAddressesToCustomerAddresses(
  addresses: Array<Address>,
): Array<CustomerAddress> {
  return addresses.map(mapSpreeAddressToCustomerAddress)
}
