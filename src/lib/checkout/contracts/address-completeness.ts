import type { CheckoutAddressInput } from './address-input'

export const CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES = [
  'address1',
  'city',
  'countryIso',
  'email',
  'firstName',
  'lastName',
  'phone',
  'postalCode',
  'stateAbbr',
  'stateName',
] as const satisfies ReadonlyArray<keyof CheckoutAddressInput>

export function mergeCheckoutAddressCompletenessValues(
  currentValues: CheckoutAddressInput,
  watchedValues: ReadonlyArray<string | undefined>,
): CheckoutAddressInput {
  const nextValues = { ...currentValues }

  for (const [
    index,
    fieldName,
  ] of CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES.entries()) {
    nextValues[fieldName] = watchedValues[index] ?? ''
  }

  return nextValues
}
