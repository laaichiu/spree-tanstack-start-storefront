import { describe, expect, it } from 'vitest'

import {
  assertCustomerResourceIsCustomer,
  assertCustomerResourceMatchesId,
  CustomerResourceIdentityMismatchError,
  CustomerResourceTypeMismatchError,
  isCustomerResourceIdentityError,
  isCustomerResourceId,
} from './customer-identity'

describe('customer resource identity', () => {
  it('accepts a non-empty customer resource id', () => {
    expect(isCustomerResourceId('cust_requested')).toBe(true)
    expect(() =>
      assertCustomerResourceIsCustomer({ id: 'cust_requested' }),
    ).not.toThrow()
  })

  it.each(['', 'cus_requested', 'user_requested', 'card_requested'])(
    'rejects an invalid customer resource id: %s',
    (id) => {
      expect(isCustomerResourceId(id)).toBe(false)
      expect(() => assertCustomerResourceIsCustomer({ id })).toThrow(
        CustomerResourceTypeMismatchError,
      )
    },
  )

  it.each([null, [], 'malformed'])(
    'rejects a malformed customer response as a type mismatch: %o',
    (resource) => {
      expect(() => assertCustomerResourceIsCustomer(resource)).toThrow(
        CustomerResourceTypeMismatchError,
      )
    },
  )

  it('requires an authenticated customer response to match its customer id', () => {
    expect(() =>
      assertCustomerResourceMatchesId(
        { id: 'cust_requested' },
        'cust_requested',
      ),
    ).not.toThrow()

    expect(() =>
      assertCustomerResourceMatchesId({ id: 'cust_other' }, 'cust_requested'),
    ).toThrow(CustomerResourceIdentityMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed customer response as an identity mismatch: %o',
    (resource) => {
      expect(() =>
        assertCustomerResourceMatchesId(resource, 'cust_requested'),
      ).toThrow(CustomerResourceIdentityMismatchError)
    },
  )

  it('classifies only customer identity errors for auth fallback handling', () => {
    expect(
      isCustomerResourceIdentityError(
        new CustomerResourceIdentityMismatchError(),
      ),
    ).toBe(true)
    expect(
      isCustomerResourceIdentityError(new CustomerResourceTypeMismatchError()),
    ).toBe(true)
    expect(isCustomerResourceIdentityError(new Error('network'))).toBe(false)
  })
})
