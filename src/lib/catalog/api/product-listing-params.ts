import type { ProductListParams } from '@spree/sdk'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type {
  ProductListingAvailability,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/model/product-listing'

const MAX_PRODUCTS_ROUTE_LIMIT = 48

export type ProductListingApiInput = {
  availability?: ProductListingAvailability
  limit?: number
  option?: string[]
  page?: number
  price_max?: number
  price_min?: number
  query?: string
  sort?: ProductListingSort
}

export function toProductListingApiInput(
  search: ProductListingSearch,
): ProductListingApiInput {
  return {
    availability: search.availability,
    limit: search.limit,
    option: search.option,
    page: search.page,
    price_max: search.price_max,
    price_min: search.price_min,
    query: search.q,
    sort: search.sort,
  }
}

export function fromProductListingApiInput(
  input: ProductListingApiInput,
): ProductListingSearch {
  return {
    availability: input.availability,
    limit: input.limit ?? DEFAULT_PRODUCT_LISTING_SEARCH.limit,
    option: input.option ?? DEFAULT_PRODUCT_LISTING_SEARCH.option,
    page: input.page ?? DEFAULT_PRODUCT_LISTING_SEARCH.page,
    price_max: input.price_max,
    price_min: input.price_min,
    q: input.query || undefined,
    sort: input.sort ?? DEFAULT_PRODUCT_LISTING_SEARCH.sort,
  }
}

function mapProductListingSort(
  sort: ProductListingSort | undefined,
): string | undefined {
  switch (sort) {
    case 'price-asc':
      return 'price'
    case 'price-desc':
      return '-price'
    case 'name-asc':
      return 'name'
    case 'name-desc':
      return '-name'
    case 'oldest':
      return 'available_on'
    case 'best-selling':
      return 'best_selling'
    case 'newest':
    default:
      return '-available_on'
  }
}

export function toProductListParams(
  search: ProductListingSearch,
  options?: {
    extra?: ProductListParams
    limit?: number
  },
): ProductListParams {
  const params: ProductListParams = {
    page: search.page,
    limit: Math.min(options?.limit ?? search.limit, MAX_PRODUCTS_ROUTE_LIMIT),
    ...(options?.extra ?? {}),
  }
  const mappedSort = mapProductListingSort(search.sort)

  if (mappedSort) params.sort = mappedSort
  if (search.q) params.search = search.q
  if (search.option.length > 0) {
    params.with_option_value_ids = search.option
  }
  if (search.price_min !== undefined) params.price_gte = search.price_min
  if (search.price_max !== undefined) params.price_lte = search.price_max
  if (search.availability === 'in_stock') params.in_stock = true
  if (search.availability === 'out_of_stock') params.out_of_stock = true

  return params
}

export function toProductFiltersParams(
  search: ProductListingSearch,
  options?: {
    categoryId?: string
  },
): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  if (options?.categoryId) query.in_category = options.categoryId
  if (search.q) query.search = search.q
  if (search.option.length > 0) {
    query.with_option_value_ids = search.option
  }
  if (search.price_min !== undefined) query.price_gte = search.price_min
  if (search.price_max !== undefined) query.price_lte = search.price_max
  if (search.availability === 'in_stock') query.in_stock = true
  if (search.availability === 'out_of_stock') query.out_of_stock = true

  const params: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(query)) {
    params[`q[${key}]${Array.isArray(value) ? '[]' : ''}`] = value
  }

  return params
}
