// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertAddressCountryDetailResource,
  AddressCountryResourceTypeMismatchError,
} from './address-country-identity'

const validCountry = {
  iso: 'US',
  name: 'United States',
  states: [{ abbr: 'CA', name: 'California' }],
  states_required: true,
  zipcode_required: true,
}

describe('address country detail response boundary', () => {
  it('accepts a complete country detail resource', () => {
    expect(() => assertAddressCountryDetailResource(validCountry)).not.toThrow()
  })

  it('accepts a country without expanded states', () => {
    expect(() =>
      assertAddressCountryDetailResource({
        ...validCountry,
        states: undefined,
      }),
    ).not.toThrow()
  })

  it.each([
    null,
    {},
    { ...validCountry, iso: 'U1' },
    { ...validCountry, states: null },
    { ...validCountry, states: [{ abbr: 'CA' }] },
    { ...validCountry, states_required: 'true' },
    { ...validCountry, zipcode_required: 1 },
  ])('rejects a malformed country detail resource: %o', (resource) => {
    expect(() => assertAddressCountryDetailResource(resource)).toThrow(
      AddressCountryResourceTypeMismatchError,
    )
  })
})
