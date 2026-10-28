import type { CartAddressParams } from '@spree/sdk'
import { toSpreeCountryCode } from '@/lib/runtime/country-code'

import type { ExpressCheckoutPartialAddress } from './checkout-express.schemas'

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function buildExpressCheckoutPlaceholderAddress(
  address: ExpressCheckoutPartialAddress,
): CartAddressParams {
  return {
    address1: 'TBD',
    city: address.city,
    country_code: toSpreeCountryCode(address.countryIso),
    first_name: 'Express',
    last_name: 'Checkout',
    postal_code: address.postalCode,
    quick_checkout: true,
    state_code: optionalAddressText(address.stateAbbr)?.toUpperCase(),
    state_name: optionalAddressText(address.stateName),
  }
}
