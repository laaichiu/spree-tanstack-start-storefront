import { formatCountryName, getMarketCollator } from '@/lib/core/market'
import type { Country, State } from '@spree/sdk'

import type { AddressCountry, AddressState } from '@/lib/core/address'

function mapSpreeStateToAddressState(state: State): AddressState {
  return {
    abbr: state.abbr,
    name: state.name,
  }
}

export function mapSpreeCountryToAddressCountry(
  country: Country,
  locale: string,
): AddressCountry {
  return {
    iso: country.iso,
    name: formatCountryName(country.iso, locale),
    states: (country.states ?? []).map(mapSpreeStateToAddressState),
    statesRequired: country.states_required,
    zipcodeRequired: country.zipcode_required,
  }
}

export function mapSpreeCountriesToAddressCountries(
  countries: Country[],
  locale: string,
): AddressCountry[] {
  const collator = getMarketCollator(locale)
  return countries
    .map((country) => mapSpreeCountryToAddressCountry(country, locale))
    .sort((left, right) => collator.compare(left.name, right.name))
}
