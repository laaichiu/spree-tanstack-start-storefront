/**
 * Framework-independent country and state metadata used by address forms.
 *
 * Market selection, request context, and address mutations stay in the
 * storefront runtime.
 */
export type AddressState = {
  abbr: string
  name: string
}

export type AddressCountry = {
  iso: string
  name: string
  states: AddressState[]
  statesRequired: boolean
  zipcodeRequired: boolean
}

export type AddressLinesInput = {
  address1: string | null
  address2: string | null
  city: string | null
  company: string | null
  countryName: string
  phone: string | null
  postalCode: string | null
  stateText: string | null
}

export type AddressDisplay = {
  fullName: string
  lines: readonly string[]
}

/**
 * Formats normalized address fields into stable customer-facing lines.
 * Address ownership, persistence and localized field labels remain runtime
 * responsibilities.
 */
export function getAddressLines(address: AddressLinesInput) {
  const region = [address.stateText, address.postalCode]
    .filter(Boolean)
    .join(' ')
  const locality = [address.city, region].filter(Boolean).join(', ')

  return [
    address.company,
    address.address1,
    address.address2,
    locality || null,
    address.countryName,
    address.phone,
  ].filter((line): line is string => Boolean(line))
}
