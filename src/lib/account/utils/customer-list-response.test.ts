// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCustomerListResponse,
  CustomerListResponseTypeMismatchError,
} from './customer-list-response'

describe('customer list response boundary', () => {
  it('accepts a response with an array data field', () => {
    expect(() => assertCustomerListResponse({ data: [] })).not.toThrow()
  })

  it.each([null, [], 'response', 123, {}, { data: null }, { data: {} }])(
    'rejects a malformed list response: %s',
    (response) => {
      expect(() => assertCustomerListResponse(response)).toThrow(
        CustomerListResponseTypeMismatchError,
      )
    },
  )
})
