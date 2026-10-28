import { describe, expect, it } from 'vitest'

import {
  assertCustomerProfileResponse,
  CustomerProfileResponseTypeMismatchError,
  isCustomerProfileResponseTypeMismatchError,
} from './customer-profile-response'

const validResponse = {
  accepts_email_marketing: true,
  available_store_credit_total: '0.00',
  display_available_store_credit_total: '$0.00',
  email: 'ada@example.com',
  first_name: 'Ada',
  id: 'cust_current',
  last_name: 'Lovelace',
  phone: null,
}

describe('customer profile response boundary', () => {
  it('accepts the fields consumed by the profile mapper', () => {
    expect(() => assertCustomerProfileResponse(validResponse)).not.toThrow()
  })

  it.each([
    null,
    undefined,
    [],
    'malformed',
    { id: 'cust_current' },
    { ...validResponse, email: undefined },
    { ...validResponse, accepts_email_marketing: 'true' },
    { ...validResponse, first_name: 42 },
    { ...validResponse, phone: 42 },
    { ...validResponse, available_store_credit_total: null },
  ])('rejects an incomplete profile response: %o', (response) => {
    expect(() => assertCustomerProfileResponse(response)).toThrow(
      CustomerProfileResponseTypeMismatchError,
    )
  })

  it('classifies only profile-shape errors', () => {
    expect(
      isCustomerProfileResponseTypeMismatchError(
        new CustomerProfileResponseTypeMismatchError(),
      ),
    ).toBe(true)
    expect(
      isCustomerProfileResponseTypeMismatchError(new Error('network')),
    ).toBe(false)
  })
})
