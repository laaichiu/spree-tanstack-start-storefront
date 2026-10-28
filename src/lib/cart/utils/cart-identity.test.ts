import { describe, expect, it } from 'vitest'

import {
  assertCartResourceHasToken,
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
  CartResourceIdentityMismatchError,
  CartResourceTokenMissingError,
  CartResourceTypeMismatchError,
  isCartResourceId,
  isCartResourceTokenMissingError,
  isCartResourceTypeMismatchError,
} from './cart-identity'

describe('cart resource identity', () => {
  it('accepts a response for the requested cart', () => {
    expect(() =>
      assertCartResourceMatchesId({ id: 'cart-us' }, 'cart-us'),
    ).not.toThrow()
  })

  it('rejects a response for another cart', () => {
    expect(() =>
      assertCartResourceMatchesId({ id: 'cart-other' }, 'cart-us'),
    ).toThrow(CartResourceIdentityMismatchError)
  })

  it('rejects a response without a cart identity', () => {
    expect(() => assertCartResourceMatchesId({}, 'cart-us')).toThrow(
      CartResourceIdentityMismatchError,
    )
  })

  it('accepts a prefixed cart resource identity', () => {
    expect(() => assertCartResourceIsCart({ id: 'cart_us' })).not.toThrow()
  })

  it.each(['cart_us', 'cart_123'])('accepts a cart id: %s', (value) => {
    expect(isCartResourceId(value)).toBe(true)
  })

  it.each(['', 'cart_', 'or_123', undefined, null])(
    'rejects a non-cart id: %s',
    (value) => {
      expect(isCartResourceId(value)).toBe(false)
    },
  )

  it('rejects an order resource identity as a cart', () => {
    expect(() => assertCartResourceIsCart({ id: 'or_us' })).toThrow(
      CartResourceTypeMismatchError,
    )
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed Cart response as a type mismatch: %o',
    (resource) => {
      expect(() => assertCartResourceIsCart(resource)).toThrow(
        CartResourceTypeMismatchError,
      )
    },
  )

  it.each([null, [], 'malformed'])(
    'rejects a malformed Cart response as an identity mismatch: %o',
    (resource) => {
      expect(() => assertCartResourceMatchesId(resource, 'cart-us')).toThrow(
        CartResourceIdentityMismatchError,
      )
    },
  )

  it('accepts a non-empty cart token', () => {
    expect(() =>
      assertCartResourceHasToken({ token: 'cart-token' }),
    ).not.toThrow()
  })

  it.each(['', '   ', undefined, null])(
    'rejects a missing cart token: %s',
    (token) => {
      expect(() => assertCartResourceHasToken({ token })).toThrow(
        CartResourceTokenMissingError,
      )
    },
  )

  it.each([null, [], 'malformed'])(
    'rejects a malformed Cart response as a missing token: %o',
    (resource) => {
      expect(() => assertCartResourceHasToken(resource)).toThrow(
        CartResourceTokenMissingError,
      )
    },
  )

  it('classifies cart resource type errors separately from id mismatches', () => {
    expect(
      isCartResourceTypeMismatchError(new CartResourceTypeMismatchError()),
    ).toBe(true)
    expect(
      isCartResourceTypeMismatchError(new CartResourceIdentityMismatchError()),
    ).toBe(false)
  })

  it('classifies missing cart token errors separately', () => {
    expect(
      isCartResourceTokenMissingError(new CartResourceTokenMissingError()),
    ).toBe(true)
    expect(
      isCartResourceTokenMissingError(new CartResourceTypeMismatchError()),
    ).toBe(false)
  })
})
