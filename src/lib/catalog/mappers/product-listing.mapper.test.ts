// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  mapSpreePaginationMetaToListingMeta,
  mapSpreeProductFiltersToListingFilters,
} from './product-listing.mapper'
import { CatalogProductFiltersResponseTypeMismatchError } from './product-filters-response'

describe('catalog listing mapping', () => {
  it('normalizes supported filters and drops backend-only categories and unknown availability values', () => {
    const filters = mapSpreeProductFiltersToListingFilters({
      default_sort: '-available_on',
      filters: [
        {
          id: 'categories',
          options: [
            {
              count: 3,
              id: 'ctg-kitchen',
              name: 'Kitchen',
              permalink: 'kitchen',
            },
          ],
          type: 'category',
        },
        {
          currency: 'USD',
          id: 'price',
          max: '250.00',
          min: '10.00',
          type: 'price_range',
        },
        {
          id: 'availability',
          options: [
            { count: 3, id: 'in_stock' },
            { count: 0, id: 'out_of_stock' },
            { count: 1, id: 'discontinued' },
          ],
          type: 'availability',
        },
        {
          id: 'opt-color',
          kind: 'color_swatch',
          label: 'Color',
          name: 'color',
          options: [
            {
              color_code: '#111111',
              count: 2,
              id: 'optval-black',
              image_url: null,
              label: 'Matte Black',
              name: 'matte-black',
              position: 1,
            },
          ],
          type: 'option',
        },
      ],
      sort_options: [{ id: 'price', label: 'Price' }],
      total_count: 3,
    })

    expect(filters).toEqual({
      defaultSort: '-available_on',
      filters: [
        {
          currency: 'USD',
          id: 'price',
          max: 250,
          min: 10,
          type: 'price_range',
        },
        {
          id: 'availability',
          options: [
            { count: 3, id: 'in_stock' },
            { count: 0, id: 'out_of_stock' },
          ],
          type: 'availability',
        },
        {
          id: 'opt-color',
          kind: 'color_swatch',
          label: 'Color',
          name: 'color',
          options: [
            {
              colorCode: '#111111',
              count: 2,
              id: 'optval-black',
              imageUrl: null,
              label: 'Matte Black',
              name: 'matte-black',
            },
          ],
          type: 'option',
        },
      ],
      sortOptions: ['price'],
      totalCount: 3,
    })
  })

  it.each([
    [19.99, 879.99],
    ['19.99', '879.99'],
    [19.99, '879.99'],
    ['19.99', 879.99],
    [0, 0],
  ])(
    'maps numeric and decimal-string facet bounds without dropping other filters: %j, %j',
    (min, max) => {
      const response = {
        default_sort: 'manual',
        filters: [
          { id: 'price', type: 'price_range', currency: 'USD', min, max },
          {
            id: 'availability',
            type: 'availability',
            options: [{ id: 'in_stock', count: 39 }],
          },
        ],
        sort_options: [{ id: 'manual' }],
        total_count: 39,
      }

      expect(mapSpreeProductFiltersToListingFilters(response)).toEqual({
        defaultSort: 'manual',
        filters: [
          {
            id: 'price',
            type: 'price_range',
            currency: 'USD',
            min: Number(min),
            max: Number(max),
          },
          {
            id: 'availability',
            type: 'availability',
            options: [{ id: 'in_stock', count: 39 }],
          },
        ],
        sortOptions: ['manual'],
        totalCount: 39,
      })
    },
  )

  it.each([
    NaN,
    Infinity,
    -Infinity,
    -1,
    '-1',
    null,
    undefined,
    '',
    ' ',
    true,
    [],
    {},
    '1e3',
    'Infinity',
  ])('rejects an invalid facet bound: %j', (bound) => {
    for (const [min, max] of [
      [bound, 100],
      [0, bound],
    ]) {
      expect(() =>
        mapSpreeProductFiltersToListingFilters({
          default_sort: 'manual',
          filters: [
            { id: 'price', type: 'price_range', currency: 'USD', min, max },
          ],
          sort_options: [{ id: 'manual' }],
          total_count: 39,
        }),
      ).toThrow(CatalogProductFiltersResponseTypeMismatchError)
    }
  })

  it('copies pagination identity without recomputing backend totals', () => {
    expect(
      mapSpreePaginationMetaToListingMeta({
        count: 24,
        from: 25,
        limit: 24,
        page: 2,
        pages: 3,
        to: 48,
      }),
    ).toEqual({
      count: 24,
      from: 25,
      limit: 24,
      page: 2,
      pages: 3,
      to: 48,
    })
  })

  it.each([
    null,
    { filters: [], sort_options: [], total_count: 0 },
    { filters: [], sort_options: null, default_sort: 'price', total_count: 0 },
    { filters: [{}], sort_options: [], default_sort: 'price', total_count: 0 },
    {
      filters: [
        {
          id: 'opt-color',
          kind: 'color_swatch',
          label: 'Color',
          name: 'color',
          options: [{ id: 'optval-black' }],
          type: 'option',
        },
      ],
      sort_options: [],
      default_sort: 'price',
      total_count: 0,
    },
    {
      filters: [],
      sort_options: [{ id: 42 }],
      default_sort: 'price',
      total_count: 0,
    },
    {
      filters: [
        {
          id: 'availability',
          options: [{ count: -1, id: 'in_stock' }],
          type: 'availability',
        },
      ],
      sort_options: [],
      default_sort: 'price',
      total_count: 0,
    },
    {
      filters: [
        {
          currency: 'USD',
          id: 'price',
          max: 10,
          min: 25,
          type: 'price_range',
        },
      ],
      sort_options: [],
      default_sort: 'price',
      total_count: 0,
    },
    {
      filters: [],
      sort_options: [{ id: ' ' }],
      default_sort: 'price',
      total_count: 0,
    },
    { filters: [], sort_options: [], default_sort: 'price', total_count: -1 },
  ])('rejects malformed filter responses: %j', (response) => {
    expect(() => mapSpreeProductFiltersToListingFilters(response)).toThrow(
      CatalogProductFiltersResponseTypeMismatchError,
    )
  })
})
