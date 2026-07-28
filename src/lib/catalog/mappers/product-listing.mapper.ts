import type {
  AvailabilityFilter as SpreeAvailabilityFilter,
  OptionFilter as SpreeOptionFilter,
  PriceRangeFilter as SpreePriceRangeFilter,
  ProductFiltersResponse as SpreeProductFiltersResponse,
} from '@spree/sdk'

import type {
  ProductListingAvailability,
  ProductListingAvailabilityFilter,
  ProductListingFilter,
  ProductListingFilters,
  ProductListingMeta,
  ProductListingOptionFilter,
  ProductListingPriceRangeFilter,
} from '../model/product-listing'

function mapSpreeOptionFilter(
  filter: SpreeOptionFilter,
): ProductListingOptionFilter {
  return {
    id: filter.id,
    type: 'option',
    name: filter.name,
    label: filter.label,
    kind: filter.kind,
    options: filter.options.map((option) => ({
      id: option.id,
      count: option.count,
      name: option.name,
      label: option.label,
      colorCode: option.color_code,
      imageUrl: option.image_url,
    })),
  }
}

function mapSpreePriceRangeFilter(
  filter: SpreePriceRangeFilter,
): ProductListingPriceRangeFilter {
  return {
    id: 'price',
    type: 'price_range',
    min: filter.min,
    max: filter.max,
    currency: filter.currency,
  }
}

function isSupportedAvailability(
  value: string,
): value is ProductListingAvailability {
  return value === 'in_stock' || value === 'out_of_stock'
}

function mapSpreeAvailabilityFilter(
  filter: SpreeAvailabilityFilter,
): ProductListingAvailabilityFilter {
  return {
    id: 'availability',
    type: 'availability',
    options: filter.options
      .filter((option) => isSupportedAvailability(option.id))
      .map((option) => ({
        id: option.id as ProductListingAvailability,
        count: option.count,
      })),
  }
}

function mapSpreeProductFilter(
  filter: SpreeProductFiltersResponse['filters'][number],
): ProductListingFilter | null {
  switch (filter.type) {
    case 'availability':
      return mapSpreeAvailabilityFilter(filter)
    case 'option':
      return mapSpreeOptionFilter(filter)
    case 'price_range':
      return mapSpreePriceRangeFilter(filter)
    case 'category':
      return null
  }
}

export function mapSpreeProductFiltersToListingFilters(
  response: SpreeProductFiltersResponse,
): ProductListingFilters {
  return {
    filters: response.filters
      .map(mapSpreeProductFilter)
      .filter((filter): filter is ProductListingFilter => filter !== null),
    sortOptions: response.sort_options.map((option) => option.id),
    defaultSort: response.default_sort,
    totalCount: response.total_count,
  }
}

export function mapSpreePaginationMetaToListingMeta(meta: {
  count: number
  from: number
  limit: number
  page: number
  pages: number
  to: number
}): ProductListingMeta {
  return {
    page: meta.page,
    limit: meta.limit,
    count: meta.count,
    pages: meta.pages,
    from: meta.from,
    to: meta.to,
  }
}
