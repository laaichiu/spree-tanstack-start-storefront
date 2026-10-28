import { describe, expect, it } from 'vitest'

import { buildSitemapEntries } from './site-indexing'

describe('brand sitemap entries', () => {
  it('indexes the Brands directory and root-level brand profiles', () => {
    const entries = buildSitemapEntries(
      [
        {
          brands: [{ slug: 'apple' }],
          categories: [],
          country: 'us',
          locale: 'en',
          products: [],
        },
      ],
      'https://storefront.example',
    )

    expect(entries.map((entry) => entry.loc)).toEqual([
      'https://storefront.example/us/en',
      'https://storefront.example/us/en/brands',
      'https://storefront.example/us/en/apple',
      'https://storefront.example/us/en/products',
    ])
  })

  it('keeps the directory absent when the seller capability is empty', () => {
    const entries = buildSitemapEntries(
      [
        {
          categories: [],
          country: 'us',
          locale: 'en',
          products: [],
        },
      ],
      'https://storefront.example',
    )

    expect(entries.some((entry) => entry.loc.endsWith('/brands'))).toBe(false)
  })
})
