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
  it('requires a delivery phone number', () => {
    const result = checkoutAddressSchema.safeParse({
      ...validAddress,
      email: 'customer@example.com',
      phone: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone).toContain(
        'Enter a phone number.',
      )
    }
  })

  it('allows billing address without a phone number', () => {
    expect(
      checkoutBillingAddressSchema.safeParse({
        ...validAddress,
        phone: '',
      }).success,
    ).toBe(true)
  })
})
