import { describe, expect, it } from 'vitest'

import type { Product } from '@/lib/catalog/model/product'

import {
  buildCatalogBreadcrumbStructuredData,
  buildListingCanonicalPath,
  buildProductStructuredData,
  shouldNoIndexProductListing,
} from './catalog-seo'

const product = {
  categoryBreadcrumbs: [
    {
      id: 'category-1',
      name: 'Kitchen',
      permalink: 'kitchen',
    },
  ],
  compareAtPrice: undefined,
  defaultVariantId: 'variant-1',
  description: 'A useful bowl.',
  descriptionHtml: '<p>A useful bowl.</p>',
  id: 'product-1',
  images: [
    {
      alt: 'Everyday Bowl',
      id: 'image-1',
      src: 'https://cdn.example.com/bowl.jpg',
      variantIds: [],
    },
  ],
  inStock: true,
  metaDescription: 'A carefully made everyday bowl.',
  name: 'Everyday Bowl',
  options: [],
  price: {
    amount: 24,
    currencyCode: 'USD',
  },
  purchasable: true,
  slug: 'everyday-bowl',
  specifications: [],
  variantCount: 1,
  variants: [
    {
      id: 'variant-1',
      inStock: true,
      optionValues: [],
      price: {
        amount: 24,
        currencyCode: 'USD',
      },
      sku: 'BOWL-1',
    },
  ],
} satisfies Product

describe('catalog SEO', () => {
  it('keeps pagination while stripping faceted listing state from canonical paths', () => {
    const search = {
      availability: 'in_stock' as const,
      limit: 48,
      option: ['option-1'],
      page: 3,
      price_min: 10,
      q: 'bowl',
      sort: 'price-asc' as const,
    }

    expect(buildListingCanonicalPath('/us/en/products', search)).toBe(
      '/us/en/products?page=3',
    )
    expect(shouldNoIndexProductListing(search)).toBe(true)
    expect(
      shouldNoIndexProductListing({
        limit: 24,
        option: [],
        page: 2,
        sort: 'newest',
      }),
    ).toBe(false)
  })

  it('builds Product offer data from normalized price and availability', () => {
    expect(
      buildProductStructuredData({
        canonicalUrl: 'https://shop.example.com/us/en/products/everyday-bowl',
        product,
      }),
    ).toEqual(
      expect.objectContaining({
        '@context': 'https://schema.org',
        '@type': 'Product',
        category: 'Kitchen',
        image: ['https://cdn.example.com/bowl.jpg'],
        name: 'Everyday Bowl',
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          price: 24,
          priceCurrency: 'USD',
          url: 'https://shop.example.com/us/en/products/everyday-bowl',
        },
        sku: 'BOWL-1',
      }),
    )
  })

  it('builds localized collection and product breadcrumb URLs', () => {
    expect(
      buildCatalogBreadcrumbStructuredData({
        breadcrumbs: product.categoryBreadcrumbs,
        canonicalUrl: 'https://shop.example.com/us/en/products/everyday-bowl',
        country: 'us',
        currentItem: { name: product.name },
        homeLabel: 'Home',
        locale: 'en',
        storefrontUrl: 'https://shop.example.com',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          item: 'https://shop.example.com/us/en',
          name: 'Home',
          position: 1,
        },
        {
          '@type': 'ListItem',
          item: 'https://shop.example.com/us/en/collections/kitchen',
          name: 'Kitchen',
          position: 2,
        },
        {
          '@type': 'ListItem',
          item: 'https://shop.example.com/us/en/products/everyday-bowl',
          name: 'Everyday Bowl',
          position: 3,
        },
      ],
    })
  })
})
