import { describe, expect, it } from 'vitest'

import {
  assertCustomerAddressId,
  assertCustomerAddressResourceIsAddress,
  assertCustomerAddressResourceMatchesId,
  CustomerAddressResourceIdentityMismatchError,
  CustomerAddressResourceTypeMismatchError,
} from './address-identity'

describe('customer address resource identity', () => {
  const validAddress = {
    address1: '1 Main Street',
    address2: null,
    city: 'Boston',
    company: null,
    country_code: 'US',
    country_name: 'United States',
    first_name: 'Ada',
    full_name: 'Ada Lovelace',
    id: 'addr_requested',
    is_default_billing: false,
    is_default_shipping: true,
    last_name: 'Lovelace',
    phone: null,
    postal_code: '02108',
    quick_checkout: false,
    state_code: 'MA',
    state_name: null,
    state_text: null,
  }

  it('accepts an address resource id', () => {
    expect(() => assertCustomerAddressId('addr_requested')).not.toThrow()
  })

  it('rejects a different resource id for address mutations', () => {
    expect(() => assertCustomerAddressId('card_requested')).toThrow(
      CustomerAddressResourceTypeMismatchError,
    )
  })

  it('accepts an address resource response', () => {
    expect(() =>
      assertCustomerAddressResourceIsAddress(validAddress),
    ).not.toThrow()
  })

  it('does not use deprecated aliases when canonical fields are missing', () => {
    expect(() =>
      assertCustomerAddressResourceIsAddress({
        ...validAddress,
        country_code: undefined,
        country_iso: 'US',
      }),
    ).toThrow(CustomerAddressResourceTypeMismatchError)
    expect(() =>
      assertCustomerAddressResourceIsAddress({
        ...validAddress,
        state_code: undefined,
        state_abbr: 'MA',
      }),
    ).toThrow(CustomerAddressResourceTypeMismatchError)
  })

  it('rejects a non-address resource response', () => {
    expect(() =>
      assertCustomerAddressResourceIsAddress({ id: 'card_requested' }),
    ).toThrow(CustomerAddressResourceTypeMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed address response as a type mismatch: %o',
    (resource) => {
      expect(() => assertCustomerAddressResourceIsAddress(resource)).toThrow(
        CustomerAddressResourceTypeMismatchError,
      )
    },
  )

  it.each([
    ['first name', { first_name: 123 }],
    ['last name', { last_name: 123 }],
    ['full name', { full_name: null }],
    ['address 1', { address1: 123 }],
    ['address 2', { address2: false }],
    ['postal code', { postal_code: 123 }],
    ['city', { city: {} }],
    ['phone', { phone: 123 }],
    ['company', { company: [] }],
    ['invalid country code', { country_code: 'USA' }],
    ['country ISO', { country_code: 123 }],
    ['state text', { state_text: 123 }],
    ['state abbreviation', { state_code: false }],
    ['quick checkout', { quick_checkout: 'false' }],
    ['default billing', { is_default_billing: 0 }],
    ['default shipping', { is_default_shipping: null }],
    ['state name', { state_name: {} }],
  ])('rejects a malformed %s field', (_field, override) => {
    expect(() =>
      assertCustomerAddressResourceIsAddress({
        ...validAddress,
        ...override,
      }),
    ).toThrow(CustomerAddressResourceTypeMismatchError)
  })

  it('requires the response id to match the requested address', () => {
    expect(() =>
      assertCustomerAddressResourceMatchesId(
        { id: 'addr_requested' },
        'addr_requested',
      ),
    ).not.toThrow()

    expect(() =>
      assertCustomerAddressResourceMatchesId(
        { id: 'addr_other' },
        'addr_requested',
      ),
    ).toThrow(CustomerAddressResourceIdentityMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed address response as an identity mismatch: %o',
    (resource) => {
      expect(() =>
        assertCustomerAddressResourceMatchesId(resource, 'addr_requested'),
      ).toThrow(CustomerAddressResourceIdentityMismatchError)
    },
  )
})
