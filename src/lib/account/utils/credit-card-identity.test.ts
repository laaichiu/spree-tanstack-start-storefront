import { describe, expect, it } from 'vitest'

import {
  assertCustomerCreditCardId,
  assertCustomerCreditCardResourceIsCreditCard,
  CustomerCreditCardResourceTypeMismatchError,
} from './credit-card-identity'

describe('customer credit-card resource identity', () => {
  const validCard = {
    brand: 'Visa',
    default: false,
    gateway_payment_profile_id: 'profile_requested',
    id: 'card_requested',
    last4: '4242',
    month: 12,
    name: null,
    year: 2030,
  }

  it('accepts a credit-card resource id', () => {
    expect(() => assertCustomerCreditCardId('card_requested')).not.toThrow()
  })

  it('rejects a different resource id for card mutations', () => {
    expect(() => assertCustomerCreditCardId('addr_requested')).toThrow(
      CustomerCreditCardResourceTypeMismatchError,
    )
  })

  it('accepts a credit-card resource response', () => {
    expect(() =>
      assertCustomerCreditCardResourceIsCreditCard(validCard),
    ).not.toThrow()
  })

  it('rejects a non-credit-card resource response', () => {
    expect(() =>
      assertCustomerCreditCardResourceIsCreditCard({ id: 'gc_requested' }),
    ).toThrow(CustomerCreditCardResourceTypeMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed credit-card response as a type mismatch: %o',
    (resource) => {
      expect(() =>
        assertCustomerCreditCardResourceIsCreditCard(resource),
      ).toThrow(CustomerCreditCardResourceTypeMismatchError)
    },
  )

  it.each([
    ['brand', { brand: 123 }],
    ['last4', { last4: 4242 }],
    ['month', { month: '12' }],
    ['year', { year: null }],
    ['name', { name: 123 }],
    ['default', { default: 'false' }],
    ['gateway payment profile', { gateway_payment_profile_id: 123 }],
  ])('rejects a malformed %s field', (_field, override) => {
    expect(() =>
      assertCustomerCreditCardResourceIsCreditCard({
        ...validCard,
        ...override,
      }),
    ).toThrow(CustomerCreditCardResourceTypeMismatchError)
  })
})
