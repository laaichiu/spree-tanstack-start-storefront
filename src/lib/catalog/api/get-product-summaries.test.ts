// @vitest-environment node

import type { Client } from '@spree/sdk'
import { describe, expect, it, vi } from 'vitest'

import { baseProduct } from '../mappers/product.mapper.fixture'
import { getProductSummaries } from './get-product-summaries'

describe('getProductSummaries', () => {
  it('loads only the default display variant for lightweight summary cards', async () => {
    const list = vi.fn(async () => ({ data: [baseProduct] }))
    const client = {
      products: { list },
    } as unknown as Client

    await getProductSummaries(client, { limit: 12 })

    expect(list).toHaveBeenCalledWith({
      expand: [
        'primary_media',
        'default_variant',
        'default_variant.primary_media',
      ],
      limit: 12,
    })
  })

  it('loads the complete variant projection when a listing needs swatches', async () => {
    const list = vi.fn(async () => ({ data: [baseProduct] }))
    const client = {
      products: { list },
    } as unknown as Client

    await getProductSummaries(client, { limit: 12 }, { includeVariants: true })

    expect(list).toHaveBeenCalledWith({
      expand: [
        'primary_media',
        'default_variant',
        'default_variant.primary_media',
        'variants',
        'variants.primary_media',
      ],
      limit: 12,
    })
  })
})
