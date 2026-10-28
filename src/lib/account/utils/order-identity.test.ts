import { describe, expect, it } from 'vitest'

import {
  assertCustomerOrderResourceIsOrder,
  assertCustomerOrderResourceMatchesId,
  CustomerOrderResourceIdentityMismatchError,
  CustomerOrderResourceTypeMismatchError,
  isCustomerOrderResourceId,
} from './order-identity'

describe('customer order resource identity', () => {
  it('recognizes an order resource id', () => {
    expect(isCustomerOrderResourceId('or_requested')).toBe(true)
  })

  it.each([undefined, '', 'or_', 'cart_123'])(
    'rejects an invalid order resource id: %o',
    (id) => {
      expect(isCustomerOrderResourceId(id)).toBe(false)
    },
  )

  it('rejects a non-order resource in list responses', () => {
    expect(() =>
      assertCustomerOrderResourceIsOrder({ id: 'cart_123' }),
    ).toThrow(CustomerOrderResourceTypeMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed order response as a type mismatch: %o',
    (resource) => {
      expect(() => assertCustomerOrderResourceIsOrder(resource)).toThrow(
        CustomerOrderResourceTypeMismatchError,
      )
    },
  )

  it('accepts the requested order resource', () => {
    expect(() =>
      assertCustomerOrderResourceMatchesId(
        { id: 'or_requested' },
        'or_requested',
      ),
    ).not.toThrow()
  })

  it('rejects a response for another order', () => {
    expect(() =>
      assertCustomerOrderResourceMatchesId({ id: 'or_other' }, 'or_requested'),
    ).toThrow(CustomerOrderResourceIdentityMismatchError)
  })

  it('rejects a cart-shaped response even when its id matches the request', () => {
    expect(() =>
      assertCustomerOrderResourceMatchesId(
        { id: 'cart_requested' },
        'cart_requested',
      ),
    ).toThrow(CustomerOrderResourceIdentityMismatchError)
  })

  it('rejects a response without an order identity', () => {
    expect(() =>
      assertCustomerOrderResourceMatchesId({}, 'or_requested'),
    ).toThrow(CustomerOrderResourceIdentityMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed order response as an identity mismatch: %o',
    (resource) => {
      expect(() =>
        assertCustomerOrderResourceMatchesId(resource, 'or_requested'),
      ).toThrow(CustomerOrderResourceIdentityMismatchError)
    },
  )
})
