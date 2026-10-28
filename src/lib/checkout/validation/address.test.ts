// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { checkoutAddressSchema, checkoutBillingAddressSchema } from './address'

const validAddress = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Diego',
  company: '',
  countryIso: 'US',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '18587790443',
  postalCode: '92121',
  stateAbbr: 'CA',
  stateName: '',
}

describe('checkout address validation', () => {
  it('normalizes valid delivery input while retaining required commerce fields', () => {
    expect(
      checkoutAddressSchema.parse({
        ...validAddress,
        email: '  customer@example.com  ',
        firstName: '  Theresa  ',
      }),
    ).toMatchObject({
      countryIso: 'US',
      email: 'customer@example.com',
      firstName: 'Theresa',
      stateAbbr: 'CA',
    })
  })

  it('requires delivery email and phone but allows an empty billing phone', () => {
    const delivery = checkoutAddressSchema.safeParse({
      ...validAddress,
      email: 'not-an-email',
      phone: '',
    })

    expect(delivery.success).toBe(false)
    if (!delivery.success) {
      const errors = delivery.error.flatten().fieldErrors
      expect(errors.email).toContain('Enter a valid email address.')
      expect(errors.phone).toContain('Enter a phone number.')
    }

    expect(
      checkoutBillingAddressSchema.safeParse({
        ...validAddress,
        phone: '',
      }).success,
    ).toBe(true)
  })

  it('requires either a state abbreviation or a state name', () => {
    const result = checkoutAddressSchema.safeParse({
      ...validAddress,
      email: 'customer@example.com',
      stateAbbr: '',
      stateName: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.stateName).toContain(
        'Enter a state / province.',
      )
    }
  })

  it('rejects malformed country identity instead of guessing a market', () => {
    const result = checkoutAddressSchema.safeParse({
      ...validAddress,
      countryIso: 'USA',
      email: 'customer@example.com',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.countryIso).toContain(
        'Select a valid country.',
      )
    }
  })
})
