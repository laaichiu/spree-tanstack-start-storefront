/**
 * Address values used by the checkout form before they are validated or
 * converted into a Spree API payload.
 *
 * The runtime owns validation and request mapping. Core only describes the
 * serializable form contract shared by checkout presentation and runtime.
 */
export type CheckoutAddressInput = {
  address1: string
  address2: string
  city: string
  company: string
  countryIso: string
  email: string
  firstName: string
  lastName: string
  phone: string
  postalCode: string
  stateAbbr: string
  stateName: string
}

export type CheckoutBillingAddressInput = Omit<CheckoutAddressInput, 'email'>
