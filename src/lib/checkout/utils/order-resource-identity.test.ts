// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  CheckoutOrderResourceIdentityMismatchError,
  assertCheckoutOrderResourceMatchesRequestedId,
  isCheckoutOrderGroupResourceId,
  isCheckoutOrderLookupId,
  isCheckoutOrderResourceId,
  isCheckoutOrderResourceIdentityCompatible,
} from './order-resource-identity'

describe('checkout order resource identity', () => {
  it.each(['or_123', 'or_order'])('accepts an Order resource id: %s', (id) => {
    expect(isCheckoutOrderResourceId(id)).toBe(true)
  })

  it.each(['', 'or_', 'cart_123', 'ps_123', undefined, null])(
    'rejects a non-Order resource id: %s',
    (id) => {
      expect(isCheckoutOrderResourceId(id)).toBe(false)
    },
  )

  it.each(['ogrp_123', 'ogrp_multi_seller'])(
    'accepts an OrderGroup resource id: %s',
    (id) => {
      expect(isCheckoutOrderGroupResourceId(id)).toBe(true)
    },
  )

  it.each(['', 'ogrp_', 'or_123', 'cart_123', undefined, null])(
    'rejects a non-OrderGroup resource id: %s',
    (id) => {
      expect(isCheckoutOrderGroupResourceId(id)).toBe(false)
    },
  )

  it.each(['cart_123', 'or_123', 'ogrp_123'])(
    'accepts a Cart, Order, or OrderGroup lookup id: %s',
    (id) => {
      expect(isCheckoutOrderLookupId(id)).toBe(true)
    },
  )

  it.each(['cart_', 'or_', 'ogrp_', 'ps_123', '', undefined])(
    'rejects an invalid lookup id: %s',
    (id) => {
      expect(isCheckoutOrderLookupId(id)).toBe(false)
    },
  )

  it('allows an Order response for a Cart-handle lookup', () => {
    expect(
      isCheckoutOrderResourceIdentityCompatible({ id: 'or_123' }, 'cart_123'),
    ).toBe(true)
  })

  it('requires a non-empty exact Order identity for an Order lookup', () => {
    expect(
      isCheckoutOrderResourceIdentityCompatible({ id: 'or_123' }, 'or_123'),
    ).toBe(true)
    expect(
      isCheckoutOrderResourceIdentityCompatible({ id: 'or_' }, 'or_'),
    ).toBe(false)
    expect(
      isCheckoutOrderResourceIdentityCompatible({ id: 'or_other' }, 'or_123'),
    ).toBe(false)
  })

  it('rejects a mixed resource before completion mapping', () => {
    expect(() =>
      assertCheckoutOrderResourceMatchesRequestedId({ id: 'or_' }, 'cart_123'),
    ).toThrow()
  })

  it.each([null, [], 'or_123', 123, {}])(
    'fails closed for a malformed Order response: %s',
    (resource) => {
      expect(
        isCheckoutOrderResourceIdentityCompatible(resource, 'cart_123'),
      ).toBe(false)
      expect(() =>
        assertCheckoutOrderResourceMatchesRequestedId(resource, 'cart_123'),
      ).toThrow(CheckoutOrderResourceIdentityMismatchError)
    },
  )
})
