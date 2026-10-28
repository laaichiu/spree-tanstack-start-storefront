// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  CartOrderResourceIdentityMismatchError,
  assertCartOrderResourceMatchesCartHandle,
  isCartOrderResourceId,
} from './order-resource-identity'

describe('cart Order fallback identity', () => {
  it('accepts a non-empty Order resource id', () => {
    expect(isCartOrderResourceId('or_123')).toBe(true)
    expect(() =>
      assertCartOrderResourceMatchesCartHandle({ id: 'or_123' }, 'cart_123'),
    ).not.toThrow()
  })

  it.each(['', 'or_', 'cart_123', undefined, null])(
    'rejects an invalid Order fallback id: %s',
    (id) => {
      expect(isCartOrderResourceId(id)).toBe(false)
      expect(() =>
        assertCartOrderResourceMatchesCartHandle({ id }, 'cart_123'),
      ).toThrow()
    },
  )

  it.each([null, [], 'or_123', 123, {}])(
    'fails closed for a malformed Order response: %s',
    (resource) => {
      expect(() =>
        assertCartOrderResourceMatchesCartHandle(resource, 'cart_123'),
      ).toThrow(CartOrderResourceIdentityMismatchError)
    },
  )
})
