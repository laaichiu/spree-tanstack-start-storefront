import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

export const CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAMES = [
  'address1',
  'address2',
  'city',
  'company',
  'countryIso',
  'firstName',
  'lastName',
  'phone',
  'postalCode',
  'stateAbbr',
  'stateName',
] as const satisfies ReadonlyArray<keyof CheckoutAddressInput>

export const CHECKOUT_ADDRESS_FIELD_NAMES = [
  'address1',
  'address2',
  'city',
  'company',
  'countryIso',
  'email',
  'firstName',
  'lastName',
  'phone',
  'postalCode',
  'stateAbbr',
  'stateName',
] as const satisfies ReadonlyArray<keyof CheckoutAddressInput>

export const CHECKOUT_BILLING_ADDRESS_FIELD_NAMES = [
  'address1',
  'address2',
  'city',
  'company',
  'countryIso',
  'firstName',
  'lastName',
  'phone',
  'postalCode',
  'stateAbbr',
  'stateName',
] as const satisfies ReadonlyArray<keyof CheckoutBillingAddressInput>

const CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAME_SET = new Set<string>(
  CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAMES,
)

export function isCheckoutShippingRateAddressFieldName(
  fieldName: string | null | undefined,
): fieldName is (typeof CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAMES)[number] {
  return Boolean(
    fieldName && CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAME_SET.has(fieldName),
  )
}
