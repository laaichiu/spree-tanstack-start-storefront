import type { CartAddressParams, UpdateCartParams } from '@spree/sdk'
import { toSpreeCountryCode } from '@/lib/runtime/country-code'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/contracts'

export type CheckoutDeliveryAddressUpdateInput =
  | {
      address: CheckoutAddressInput
      email?: string
      shippingAddressId?: never
    }
  | {
      address?: never
      email?: string
      shippingAddressId: string
    }

export type CheckoutDeliveryAddressUpdateParams = Pick<
  UpdateCartParams,
  'email' | 'shipping_address' | 'shipping_address_id'
> & {
  use_shipping: true
}

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function mapCheckoutAddressToParams(
  address: CheckoutAddressInput | CheckoutBillingAddressInput,
): CartAddressParams {
  return {
    address1: address.address1,
    address2: optionalAddressText(address.address2),
    city: address.city,
    company: optionalAddressText(address.company),
    country_code: toSpreeCountryCode(address.countryIso),
    first_name: address.firstName,
    last_name: address.lastName,
    phone: optionalAddressText(address.phone),
    postal_code: address.postalCode,
    state_code: optionalAddressText(address.stateAbbr)?.toUpperCase(),
    state_name: optionalAddressText(address.stateName),
  }
}

export function buildCheckoutAddressUpdateParams({
  address,
  email,
  shippingAddressId,
}: CheckoutDeliveryAddressUpdateInput): CheckoutDeliveryAddressUpdateParams {
  const normalizedEmail = optionalAddressText(address?.email ?? email)

  return {
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(address
      ? {
          shipping_address: mapCheckoutAddressToParams(address),
        }
      : {
          shipping_address_id: shippingAddressId,
        }),
    use_shipping: true,
  }
}
