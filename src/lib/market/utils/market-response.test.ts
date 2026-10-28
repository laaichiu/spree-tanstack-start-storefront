// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertMarketResponse,
  MarketResponseTypeMismatchError,
} from './market-resource-identity'
import { marketResource } from './market-response.test-support'

describe('market response boundary', () => {
  it('accepts the fields used by market mapping', () => {
    expect(() => assertMarketResponse(marketResource())).not.toThrow()
  })

  it.each([
    ['name', { name: undefined }],
    ['currency', { currency: null }],
    ['default locale', { default_locale: 123 }],
    ['tax flag', { tax_inclusive: 'no' }],
    ['default flag', { default: null }],
    ['country codes', { country_codes: 'US' }],
    ['supported locales', { supported_locales: [null] }],
    ['expanded country', { countries: [{ iso: 'USA' }] }],
  ])('rejects a malformed market %s field', (_field, override) => {
    expect(() => assertMarketResponse(marketResource(override))).toThrow(
      MarketResponseTypeMismatchError,
    )
  })

  it('accepts an optional expanded country collection', () => {
    expect(() =>
      assertMarketResponse(
        marketResource({
          countries: [{ iso: 'US', name: 'United States' }],
        }),
      ),
    ).not.toThrow()
  })
})
