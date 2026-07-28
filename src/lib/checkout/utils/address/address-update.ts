import type { AddressParams } from '@spree/sdk'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

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

export type CheckoutDeliveryAddressUpdateParams = {
  email?: string
  shipping_address?: AddressParams
  shipping_address_id?: string
  use_shipping: true
}

export type CheckoutAddressSaveSkipReason = 'already_pending' | 'already_saved'

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function getCheckoutAddressSaveSkipReason({
  force = false,
  lastAttemptSignature,
  lastSavedSignature,
  pendingSignature,
  signature,
}: {
  force?: boolean
  lastAttemptSignature?: string | null
  lastSavedSignature?: string | null
  pendingSignature?: string | null
  signature: string
}): CheckoutAddressSaveSkipReason | null {
  if (force) {
    return null
  }

  if (lastSavedSignature && signature === lastSavedSignature) {
    return 'already_saved'
  }

  if (
    (pendingSignature && signature === pendingSignature) ||
    (lastAttemptSignature && signature === lastAttemptSignature)
  ) {
    return 'already_pending'
  }

  return null
}

export function mapCheckoutAddressToParams(
  address: CheckoutAddressInput | CheckoutBillingAddressInput,
): AddressParams {
  return {
    address1: address.address1,
    address2: optionalAddressText(address.address2),
    city: address.city,
    company: optionalAddressText(address.company),
    country_iso: address.countryIso.toUpperCase(),
    first_name: address.firstName,
    last_name: address.lastName,
    phone: optionalAddressText(address.phone),
    postal_code: address.postalCode,
    state_abbr: optionalAddressText(address.stateAbbr)?.toUpperCase(),
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

export function preservePendingCheckoutEmail({
  currentValues,
  nextValues,
}: {
  currentValues: CheckoutAddressInput
  nextValues: CheckoutAddressInput
}): CheckoutAddressInput {
  if (nextValues.email.trim() || !currentValues.email.trim()) {
    return nextValues
  }

  return {
    ...nextValues,
    email: currentValues.email,
  }
}
