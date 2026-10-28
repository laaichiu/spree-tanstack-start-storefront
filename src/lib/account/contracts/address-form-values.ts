import type { CustomerAddress } from './address'

export type CustomerAddressFormValues = {
  address1: string
  address2: string
  city: string
  company: string
  countryIso: string
  firstName: string
  isDefaultBilling: boolean
  isDefaultShipping: boolean
  lastName: string
  phone: string
  postalCode: string
  stateAbbr: string
  stateName: string
}

export function getCustomerAddressFormDefaults({
  address,
  fallbackCountry,
}: {
  address: CustomerAddress | null
  fallbackCountry: string
}): CustomerAddressFormValues {
  return {
    address1: address?.address1 ?? '',
    address2: address?.address2 ?? '',
    city: address?.city ?? '',
    company: address?.company ?? '',
    countryIso: address?.countryIso ?? fallbackCountry.toUpperCase(),
    firstName: address?.firstName ?? '',
    isDefaultBilling: address?.isDefaultBilling ?? false,
    isDefaultShipping: address?.isDefaultShipping ?? false,
    lastName: address?.lastName ?? '',
    phone: address?.phone ?? '',
    postalCode: address?.postalCode ?? '',
    stateAbbr: address?.stateAbbr ?? '',
    stateName: address?.stateName ?? '',
  }
}
