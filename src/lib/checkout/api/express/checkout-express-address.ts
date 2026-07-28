import type { AddressParams } from '@spree/sdk'

import type { ExpressCheckoutPartialAddress } from './checkout-express.schemas'

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function buildExpressCheckoutPlaceholderAddress(
  address: ExpressCheckoutPartialAddress,
): AddressParams {
  return {
    address1: 'TBD',
    city: address.city,
    country_iso: address.countryIso.toUpperCase(),
    first_name: 'Express',
    last_name: 'Checkout',
    postal_code: address.postalCode,
    quick_checkout: true,
    state_abbr: optionalAddressText(address.stateAbbr)?.toUpperCase(),
    state_name: optionalAddressText(address.stateName),
  }
}
