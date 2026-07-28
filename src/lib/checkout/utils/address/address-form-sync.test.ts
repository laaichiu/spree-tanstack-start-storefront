import { describe, expect, it } from 'vitest'

import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'

import { getCheckoutAddressFormSyncPlan } from './address-form-sync'

const addressValues = {
  address1: '123 Main Street',
  address2: '',
  city: 'New York',
  company: '',
  countryIso: 'US',
  email: 'buyer@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '555-123-4567',
  postalCode: '10001',
  stateAbbr: 'NY',
  stateName: '',
} satisfies CheckoutAddressInput

const fieldNames = [
  'email',
  'countryIso',
  'stateAbbr',
  'stateName',
  'postalCode',
] as const

describe('getCheckoutAddressFormSyncPlan', () => {
  it('tracks changed fields without validating clean values', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentValues: addressValues,
        fieldNames,
        nextValues: {
          ...addressValues,
          postalCode: '10002',
        },
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: ['postalCode'],
      fieldsToClear: [],
      fieldsToValidate: [],
    })
  })

  it('revalidates changed values that already have errors', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentErrorFields: ['postalCode'],
        currentValues: {
          ...addressValues,
          postalCode: '',
        },
        fieldNames,
        nextValues: {
          ...addressValues,
          postalCode: '10002',
        },
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: ['postalCode'],
      fieldsToClear: ['postalCode'],
      fieldsToValidate: ['postalCode'],
    })
  })

  it('tracks state changes without validating clean values', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentValues: addressValues,
        fieldNames,
        nextValues: {
          ...addressValues,
          stateAbbr: '',
          stateName: 'Ontario',
        },
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: ['stateAbbr', 'stateName'],
      fieldsToClear: [],
      fieldsToValidate: [],
    })
  })

  it('revalidates both state fields when an existing state error changes', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentErrorFields: ['stateName'],
        currentValues: {
          ...addressValues,
          stateAbbr: '',
          stateName: '',
        },
        fieldNames,
        nextValues: {
          ...addressValues,
          stateAbbr: '',
          stateName: 'Ontario',
        },
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: ['stateName'],
      fieldsToClear: ['stateName', 'stateAbbr'],
      fieldsToValidate: ['stateName', 'stateAbbr'],
    })
  })

  it('revalidates unchanged fields that already have errors', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentErrorFields: ['email'],
        currentValues: addressValues,
        fieldNames,
        nextValues: addressValues,
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: [],
      fieldsToClear: ['email'],
      fieldsToValidate: ['email'],
    })
  })

  it('does not clear blank invalid fields', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentErrorFields: ['email'],
        currentValues: {
          ...addressValues,
          email: '',
        },
        fieldNames,
        nextValues: {
          ...addressValues,
          email: '',
        },
        shouldValidate: true,
      }),
    ).toEqual({
      changedFields: [],
      fieldsToClear: [],
      fieldsToValidate: ['email'],
    })
  })

  it('does not revalidate existing errors when validation was not requested', () => {
    expect(
      getCheckoutAddressFormSyncPlan({
        currentErrorFields: ['email'],
        currentValues: addressValues,
        fieldNames,
        nextValues: addressValues,
        shouldValidate: false,
      }),
    ).toEqual({
      changedFields: [],
      fieldsToClear: [],
      fieldsToValidate: [],
    })
  })
})
