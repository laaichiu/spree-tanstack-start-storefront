import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

type CheckoutAddressRegionFields = Pick<
  CheckoutAddressInput | CheckoutBillingAddressInput,
  'countryIso' | 'stateAbbr' | 'stateName'
>

export function getCheckoutCountryChangeValues(
  countryIso: string,
): CheckoutAddressRegionFields {
  return {
    countryIso,
    stateAbbr: '',
    stateName: '',
  }
}

export function getCheckoutStateAbbrChangeValues(
  stateAbbr: string,
): Pick<CheckoutAddressRegionFields, 'stateAbbr' | 'stateName'> {
  return {
    stateAbbr,
    stateName: '',
  }
}

export function getCheckoutStateNameChangeValues(
  stateName: string,
): Pick<CheckoutAddressRegionFields, 'stateAbbr' | 'stateName'> {
  return {
    stateAbbr: '',
    stateName,
  }
}
