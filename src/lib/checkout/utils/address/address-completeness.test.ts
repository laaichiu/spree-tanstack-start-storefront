import { describe, expect, it } from 'vitest'

import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'

import {
  CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES,
  mergeCheckoutAddressCompletenessValues,
} from './address-completeness'

const currentValues: CheckoutAddressInput = {
  address1: '1 Main Street',
  address2: 'Suite 2',
  city: 'New York',
  company: 'Spree',
  countryIso: 'US',
  email: 'customer@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '555-0100',
  postalCode: '10001',
  stateAbbr: 'NY',
  stateName: '',
}

describe('checkout address completeness values', () => {
  it('keeps optional fields while updating watched required fields', () => {
    const watchedValues = CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES.map(
      (fieldName) =>
        fieldName === 'city' ? 'Boston' : currentValues[fieldName],
    )

    expect(
      mergeCheckoutAddressCompletenessValues(currentValues, watchedValues),
    ).toEqual({
      ...currentValues,
      city: 'Boston',
    })
  })

  it('normalizes an unavailable watched value to an empty field', () => {
    const watchedValues = CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES.map(
      (fieldName) =>
        fieldName === 'email' ? undefined : currentValues[fieldName],
    )

    expect(
      mergeCheckoutAddressCompletenessValues(currentValues, watchedValues)
        .email,
    ).toBe('')
  })
})
