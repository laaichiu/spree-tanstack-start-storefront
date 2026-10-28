import { CountryCode } from '@spree/sdk'

// RC5 exposes the API's ISO country vocabulary at runtime as well as in types.
const countryCodes = Object.values(CountryCode)

export function toSpreeCountryCode(value: string): CountryCode {
  const normalizedCode = value.trim().toUpperCase()
  const code = countryCodes.find((candidate) => candidate === normalizedCode)
  if (!code) throw new Error('The country code is invalid.')
  return code
}
