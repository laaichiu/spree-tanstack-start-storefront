// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCartListResponse,
  CartListResponseTypeMismatchError,
} from './cart-list-response'

describe('cart list response boundary', () => {
  it('accepts a response with an array data field', () => {
    expect(() => assertCartListResponse({ data: [] })).not.toThrow()
  })

  it.each([null, [], 'response', 123, {}, { data: null }, { data: {} }])(
    'rejects a malformed list response: %s',
    (response) => {
      expect(() => assertCartListResponse(response)).toThrow(
        CartListResponseTypeMismatchError,
      )
    },
  )
})
