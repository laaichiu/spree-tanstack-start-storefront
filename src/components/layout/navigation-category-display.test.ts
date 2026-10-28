import { describe, expect, it } from 'vitest'

import { isSaleCategory } from './navigation-category-display'

describe('isSaleCategory', () => {
  it('uses stable sale paths and avoids partial-name matches', () => {
    expect(isSaleCategory({ name: 'Sale', permalink: 'sale' })).toBe(true)
    expect(
      isSaleCategory({ name: 'Offers', permalink: 'collections/sale' }),
    ).toBe(true)
    expect(isSaleCategory({ name: 'Wholesale', permalink: 'wholesale' })).toBe(
      false,
    )
  })
})
