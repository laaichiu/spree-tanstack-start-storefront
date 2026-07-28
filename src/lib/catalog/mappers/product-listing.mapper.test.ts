import type { ProductFiltersResponse } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeProductFiltersToListingFilters } from './product-listing.mapper'

describe('mapSpreeProductFiltersToListingFilters', () => {
  it('maps supported Spree product filters into the storefront listing model', () => {
    const filters = mapSpreeProductFiltersToListingFilters({
      default_sort: '-available_on',
      total_count: 3,
      sort_options: [{ id: 'price' }],
      filters: [
        {
          id: 'categories',
          type: 'category',
          options: [
            {
              id: 'ctg-kitchen',
              name: 'Kitchen',
              permalink: 'kitchen',
              count: 3,
            },
          ],
        },
        {
          id: 'price',
          type: 'price_range',
          min: 10,
          max: 250,
          currency: 'USD',
        },
        {
          id: 'availability',
          type: 'availability',
          options: [
            { id: 'in_stock', count: 3 },
            { id: 'out_of_stock', count: 0 },
            { id: 'discontinued', count: 1 },
          ],
        },
        {
          id: 'opt-color',
          type: 'option',
          name: 'color',
          label: 'Color',
          kind: 'color_swatch',
          options: [
            {
              id: 'optval-black',
              count: 2,
              name: 'matte-black',
              label: 'Matte Black',
              position: 1,
              color_code: '#111111',
              image_url: null,
            },
          ],
        },
      ],
    } satisfies ProductFiltersResponse)

    expect(filters).toEqual({
      defaultSort: '-available_on',
      totalCount: 3,
      sortOptions: ['price'],
      filters: [
        {
          id: 'price',
          type: 'price_range',
          min: 10,
          max: 250,
          currency: 'USD',
        },
        {
          id: 'availability',
          type: 'availability',
          options: [
            { id: 'in_stock', count: 3 },
            { id: 'out_of_stock', count: 0 },
          ],
        },
        {
          id: 'opt-color',
          type: 'option',
          name: 'color',
          label: 'Color',
          kind: 'color_swatch',
          options: [
            {
              id: 'optval-black',
              count: 2,
              name: 'matte-black',
              label: 'Matte Black',
              colorCode: '#111111',
              imageUrl: null,
            },
          ],
        },
      ],
    })
  })
})
