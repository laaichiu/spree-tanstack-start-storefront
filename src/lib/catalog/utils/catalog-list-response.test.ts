// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCatalogListResponse,
  CatalogListResponseTypeMismatchError,
} from './catalog-list-response'

describe('catalog list response boundary', () => {
  it('accepts a response with an array data field', () => {
    expect(() => assertCatalogListResponse({ data: [] })).not.toThrow()
  })

  it.each([null, [], 'response', 123, {}, { data: null }, { data: {} }])(
    'rejects a malformed list response: %s',
    (response) => {
      expect(() => assertCatalogListResponse(response)).toThrow(
        CatalogListResponseTypeMismatchError,
      )
    },
  )
})
