// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertAddressCountryListResponse,
  assertAddressCountryResourceIsCountry,
  AddressCountryListResponseTypeMismatchError,
} from './address-country-list-response'
import { addressCountryResource } from './address-country-response.test-support'

describe('address country list response boundary', () => {
  it('accepts a response with valid country records', () => {
    const response = { data: [addressCountryResource()] }

    expect(() => assertAddressCountryListResponse(response)).not.toThrow()
    response.data.forEach(assertAddressCountryResourceIsCountry)
  })

  it('accepts an optional expanded state collection', () => {
    expect(() =>
      assertAddressCountryResourceIsCountry(
        addressCountryResource({
          states: [{ abbr: 'CA', name: 'California' }],
        }),
      ),
    ).not.toThrow()
  })

  it.each([null, [], 'response', 123, {}, { data: null }, { data: {} }])(
    'rejects a malformed list response: %s',
    (response) => {
      expect(() => assertAddressCountryListResponse(response)).toThrow(
        AddressCountryListResponseTypeMismatchError,
      )
    },
  )

  it.each([
    null,
    [],
    {},
    { iso: '' },
    { iso: 'USA' },
    addressCountryResource({ iso: 'U1' }),
    addressCountryResource({ states: 'malformed' }),
    addressCountryResource({ states: [{ abbr: 'CA' }] }),
    addressCountryResource({ states_required: 'true' }),
    addressCountryResource({ zipcode_required: 1 }),
  ])('rejects a malformed country list item: %s', (country) => {
    expect(() => assertAddressCountryResourceIsCountry(country)).toThrow(
      AddressCountryListResponseTypeMismatchError,
    )
  })
})
