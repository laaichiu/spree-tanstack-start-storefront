import type { Country, State } from '@spree/sdk'

import type {
  AddressCountry,
  AddressState,
} from '@/lib/market/model/address-country'

function mapSpreeStateToAddressState(state: State): AddressState {
  return {
    abbr: state.abbr,
    name: state.name,
  }
}

export function mapSpreeCountryToAddressCountry(
  country: Country,
): AddressCountry {
  return {
    iso: country.iso,
    name: country.name,
    states: (country.states ?? []).map(mapSpreeStateToAddressState),
    statesRequired: country.states_required,
    zipcodeRequired: country.zipcode_required,
  }
}

export function mapSpreeCountriesToAddressCountries(
  countries: Country[],
): AddressCountry[] {
  return countries.map(mapSpreeCountryToAddressCountry)
}
