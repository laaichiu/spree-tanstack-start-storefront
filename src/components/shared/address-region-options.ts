import type { AddressCountry } from '@/lib/core/address'
import type { AddressRegionOption } from './address-region.types'

export function normalizeAddressRegionCode(value: string): string {
  return value.trim().toUpperCase()
}

function appendCurrentRegionOption(
  options: AddressRegionOption[],
  currentValue: string,
): AddressRegionOption[] {
  const normalizedValue = normalizeAddressRegionCode(currentValue)

  if (
    !normalizedValue ||
    options.some((option) => option.value === normalizedValue)
  ) {
    return options
  }

  return [
    ...options,
    {
      label: normalizedValue,
      value: normalizedValue,
    },
  ]
}

/**
 * Projects normalized countries into the theme's address selector options.
 *
 * The runtime still owns loading and request errors. This projection keeps
 * option identity stable and preserves an existing value while country data
 * is incomplete or being refreshed.
 */
export function getAddressCountryOptions(
  countries: readonly AddressCountry[],
  currentIso: string,
): AddressRegionOption[] {
  const options = countries.map((country) => ({
    label: `${country.name} (${normalizeAddressRegionCode(country.iso)})`,
    value: normalizeAddressRegionCode(country.iso),
  }))

  return appendCurrentRegionOption(options, currentIso)
}

/**
 * Projects one normalized country's states into the theme's selector options.
 *
 * Placeholder and loading/error labels remain component concerns; this
 * projection only handles API-backed state options and the current-value
 * fallback used while country data is incomplete.
 */
export function getAddressStateOptions(
  country: AddressCountry | null | undefined,
  currentAbbr: string,
): AddressRegionOption[] {
  const options =
    country?.states.map((state) => ({
      label: `${state.name} (${normalizeAddressRegionCode(state.abbr)})`,
      value: normalizeAddressRegionCode(state.abbr),
    })) ?? []

  return appendCurrentRegionOption(options, currentAbbr)
}
