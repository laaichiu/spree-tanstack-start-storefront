import { describe, expect, it } from 'vitest'

import type { ProductImage } from '../model/product'
import { getVisibleProductImagesForVariant } from './product-media-selection'

const PRODUCT_IMAGES: ProductImage[] = [
  {
    id: 'shared-1',
    src: 'https://example.com/shared-1.jpg',
    alt: 'Shared image 1',
    variantIds: [],
  },
  {
    id: 'shared-2',
    src: 'https://example.com/shared-2.jpg',
    alt: 'Shared image 2',
    variantIds: [],
  },
  {
    id: 'white-1',
    src: 'https://example.com/white-1.jpg',
    alt: 'White image 1',
    variantIds: ['variant-white'],
  },
  {
    id: 'white-2',
    src: 'https://example.com/white-2.jpg',
    alt: 'White image 2',
    variantIds: ['variant-white'],
  },
  {
    id: 'black-1',
    src: 'https://example.com/black-1.jpg',
    alt: 'Black image 1',
    variantIds: ['variant-black'],
  },
]

describe('getVisibleProductImagesForVariant', () => {
  it('returns the full gallery when no variant is selected', () => {
    expect(getVisibleProductImagesForVariant(PRODUCT_IMAGES, null)).toEqual(
      PRODUCT_IMAGES,
    )
  })

  it('returns only images linked to the selected variant when they exist', () => {
    expect(
      getVisibleProductImagesForVariant(PRODUCT_IMAGES, 'variant-white'),
    ).toEqual([
      {
        id: 'white-1',
        src: 'https://example.com/white-1.jpg',
        alt: 'White image 1',
        variantIds: ['variant-white'],
      },
      {
        id: 'white-2',
        src: 'https://example.com/white-2.jpg',
        alt: 'White image 2',
        variantIds: ['variant-white'],
      },
    ])
  })

  it('falls back to shared product images when the selected variant has no linked images', () => {
    expect(
      getVisibleProductImagesForVariant(PRODUCT_IMAGES, 'variant-steel'),
    ).toEqual([
      {
        id: 'shared-1',
        src: 'https://example.com/shared-1.jpg',
        alt: 'Shared image 1',
        variantIds: [],
      },
      {
        id: 'shared-2',
        src: 'https://example.com/shared-2.jpg',
        alt: 'Shared image 2',
        variantIds: [],
      },
    ])
  })

  it('falls back to the original gallery when there is no variant-specific or shared image', () => {
    const images: ProductImage[] = [
      {
        id: 'white-1',
        src: 'https://example.com/white-1.jpg',
        alt: 'White image 1',
        variantIds: ['variant-white'],
      },
      {
        id: 'black-1',
        src: 'https://example.com/black-1.jpg',
        alt: 'Black image 1',
        variantIds: ['variant-black'],
      },
    ]

    expect(getVisibleProductImagesForVariant(images, 'variant-steel')).toEqual(
      images,
    )
  })
})
