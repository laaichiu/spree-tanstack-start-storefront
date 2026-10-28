import { formatCountryName } from '@/lib/core/market'
import type { Address as SpreeAddress } from '@spree/sdk'

import type { CheckoutAddress } from '@/lib/checkout/contracts'
import { normalizeCheckoutText } from './checkout-text.mapper'

export function mapSpreeCheckoutAddress(
  address: SpreeAddress | null,
  locale: string,
): CheckoutAddress | null {
  if (!address) {
    return null
  }

  return {
    address1: normalizeCheckoutText(address.address1),
    address2: normalizeCheckoutText(address.address2),
    city: normalizeCheckoutText(address.city),
    company: normalizeCheckoutText(address.company),
    countryIso: address.country_code,
    countryName: formatCountryName(address.country_code, locale),
    firstName: normalizeCheckoutText(address.first_name),
    fullName: address.full_name,
    id: address.id,
    lastName: normalizeCheckoutText(address.last_name),
    phone: normalizeCheckoutText(address.phone),
    postalCode: normalizeCheckoutText(address.postal_code),
    stateAbbr: normalizeCheckoutText(address.state_code),
    stateName: normalizeCheckoutText(address.state_name),
    stateText: normalizeCheckoutText(address.state_text),
  }
}
