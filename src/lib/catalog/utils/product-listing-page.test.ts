import { describe, expect, it } from 'vitest'

import type { CategoryDetail } from '@/lib/catalog/model/category'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import {
  createCollectionListingPage,
  createProductsListingPage,
} from './product-listing-page'

const listing = {
  filters: null,
  meta: {
    count: 1,
    from: 1,
    limit: 24,
    page: 1,
    pages: 1,
    to: 1,
  },
  products: [
    {
      description: 'A useful mug.',
      id: 'product-mug',
      image: null,
      inStock: true,
      name: 'Everyday Mug',
      price: { amount: 12, currencyCode: 'USD' },
      slug: 'everyday-mug',
    },
  ],
}

const category = {
  breadcrumbs: [
    { id: 'category-kitchen', name: 'Kitchen', permalink: 'kitchen' },
    {
      id: 'category-drinkware',
      name: 'Drinkware',
      permalink: 'kitchen/drinkware',
    },
  ],
  description: 'Tools for the table.',
  id: 'category-drinkware',
  imageUrl: null,
  metaDescription: null,
  metaTitle: null,
  name: 'Drinkware',
  permalink: 'kitchen/drinkware',
} satisfies CategoryDetail

describe('product listing page model', () => {
  it('builds products and search pages from normalized listing data', () => {
    const search = {
      ...DEFAULT_PRODUCT_LISTING_SEARCH,
      q: 'mug',
    }
    const page = createProductsListingPage({
      listing,
      locale: 'en',
      search,
    })

    expect(page).toMatchObject({
      category: null,
      kind: 'products',
      search,
      status: 'ready',
      title: 'Search results for "mug"',
    })
    expect(page.products).toHaveLength(1)
    expect(page.meta?.count).toBe(1)
  })

  it('builds collection presentation from the normalized category', () => {
    const page = createCollectionListingPage({
      listing: { ...listing, category },
      locale: 'en',
      search: DEFAULT_PRODUCT_LISTING_SEARCH,
    })

    expect(page).toMatchObject({
      category,
      description: 'Tools for the table.',
      kind: 'collection',
      status: 'ready',
      title: 'Drinkware',
    })
  })

  it('keeps products and collection failures as stable page states', () => {
    expect(
      createProductsListingPage({
        listing: null,
        locale: 'en',
        search: DEFAULT_PRODUCT_LISTING_SEARCH,
      }),
    ).toMatchObject({
      meta: null,
      products: [],
      status: 'error',
      title: 'Products',
    })
    expect(
      createCollectionListingPage({
        listing: null,
        locale: 'en',
        search: DEFAULT_PRODUCT_LISTING_SEARCH,
      }),
    ).toMatchObject({
      category: null,
      meta: null,
      products: [],
      status: 'error',
      title: 'Collection unavailable',
    })
  })
})
