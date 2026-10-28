import { describe, expect, it } from 'vitest'

import { DEFAULT_BRAND_SEARCH, parseBrandSearch } from './brand-search'

describe('parseBrandSearch', () => {
  it('shares the collection listing search contract', () => {
    expect(parseBrandSearch({ page: '3', sort: 'price-desc' })).toEqual({
      ...DEFAULT_BRAND_SEARCH,
      page: 3,
      sort: 'price-desc',
    })
    expect(parseBrandSearch({ page: '0' })).toEqual(DEFAULT_BRAND_SEARCH)
    expect(parseBrandSearch({ page: 'not-a-page' })).toEqual(
      DEFAULT_BRAND_SEARCH,
    )
  })
})
