// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parseProductListingSearch } from './product-listing-search'

describe('catalog product listing search parser', () => {
  it('preserves valid numeric price filters including zero', () => {
    expect(
      parseProductListingSearch({
        price_max: ' 12.50 ',
        price_min: '0',
      }),
    ).toMatchObject({
      price_max: 12.5,
      price_min: 0,
    })
  })

  it('does not turn blank price filters into zero', () => {
    expect(
      parseProductListingSearch({
        price_max: '  ',
        price_min: '\t',
      }),
    ).toMatchObject({
      price_max: undefined,
      price_min: undefined,
    })
  })

  it('rejects non-string and non-finite price filters', () => {
    expect(
      parseProductListingSearch({
        price_max: true,
        price_min: ['12'],
      }),
    ).toMatchObject({
      price_max: undefined,
      price_min: undefined,
    })
  })

  it('keeps page and limit positive when search values are fractional', () => {
    expect(
      parseProductListingSearch({
        limit: '0.5',
        page: 0.5,
      }),
    ).toMatchObject({
      limit: 24,
      page: 1,
    })
  })

  it('does not coerce non-scalar page and limit values', () => {
    expect(
      parseProductListingSearch({
        limit: [1],
        page: true,
      }),
    ).toMatchObject({
      limit: 24,
      page: 1,
    })
  })
})
