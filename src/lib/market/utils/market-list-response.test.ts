// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertMarketListResponse,
  MarketListResponseTypeMismatchError,
} from './market-list-response'

describe('market list response boundary', () => {
  it('accepts a response with an array data field', () => {
    expect(() => assertMarketListResponse({ data: [] })).not.toThrow()
  })

  it.each([null, [], 'response', 123, {}, { data: null }, { data: {} }])(
    'rejects a malformed list response: %s',
    (response) => {
      expect(() => assertMarketListResponse(response)).toThrow(
        MarketListResponseTypeMismatchError,
      )
    },
  )
})
