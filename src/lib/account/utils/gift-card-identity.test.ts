import { describe, expect, it } from 'vitest'

import {
  assertCustomerGiftCardResourceIsGiftCard,
  CustomerGiftCardResourceTypeMismatchError,
} from './gift-card-identity'

describe('customer gift-card resource identity', () => {
  const validGiftCard = {
    active: true,
    amount: '100.00',
    amount_authorized: null,
    amount_remaining: '100.00',
    amount_used: '0.00',
    code: 'GIFT-CARD-REQUESTED',
    currency: 'USD',
    display_amount: '$100.00',
    display_amount_remaining: '$100.00',
    display_amount_used: '$0.00',
    expired: false,
    expires_at: null,
    id: 'gc_requested',
    redeemed_at: null,
    status: 'active',
  }

  it('accepts a gift-card resource response', () => {
    expect(() =>
      assertCustomerGiftCardResourceIsGiftCard(validGiftCard),
    ).not.toThrow()
  })

  it.each(['card_requested', 'addr_requested', ''])(
    'rejects a non-gift-card resource id: %s',
    (id) => {
      expect(() => assertCustomerGiftCardResourceIsGiftCard({ id })).toThrow(
        CustomerGiftCardResourceTypeMismatchError,
      )
    },
  )

  it.each([null, [], 'malformed'])(
    'rejects a malformed gift-card response as a type mismatch: %o',
    (resource) => {
      expect(() => assertCustomerGiftCardResourceIsGiftCard(resource)).toThrow(
        CustomerGiftCardResourceTypeMismatchError,
      )
    },
  )

  it.each([
    ['code', { code: 123 }],
    ['status', { status: null }],
    ['currency', { currency: 123 }],
    ['amount', { amount: 100 }],
    ['amount used', { amount_used: false }],
    ['amount authorized', { amount_authorized: 0 }],
    ['amount remaining', { amount_remaining: {} }],
    ['hexadecimal amount', { amount: '0x10' }],
    ['exponential amount', { amount_used: '1e2' }],
    ['empty amount', { amount_remaining: '' }],
    ['expires at', { expires_at: 123 }],
    ['redeemed at', { redeemed_at: {} }],
    ['expired', { expired: 'false' }],
    ['active', { active: 1 }],
  ])('rejects a malformed %s field', (_field, override) => {
    expect(() =>
      assertCustomerGiftCardResourceIsGiftCard({
        ...validGiftCard,
        ...override,
      }),
    ).toThrow(CustomerGiftCardResourceTypeMismatchError)
  })
})
