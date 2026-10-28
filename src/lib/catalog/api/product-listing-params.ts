import type {
  ProductFiltersParams,
  ProductListParams,
  ProductSort,
} from '@spree/sdk'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type {
  ProductListingAvailability,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/contracts'

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
): ProductSort | undefined {
  switch (sort) {
    case 'price-asc':
      return 'price'
    case 'price-desc':
      return '-price'
    case 'name-asc':
      return 'name'
    case 'name-desc':
      return '-name'
    // `available_on` is nullable in Spree. PostgreSQL sorts NULL values first
    // for a descending order, which makes `-available_on` put undated products
    // ahead of genuinely newer products. The storefront's Newest/Oldest labels
    // describe when a product was added, so use the non-null creation timestamp
    // for a deterministic, paginated server-side sort.
    case 'oldest':
      return 'created_at'
    case 'best-selling':
      return 'best_selling'
    case 'newest':
    default:
      return '-created_at'
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
  if (search.price_min !== undefined)
    params.price_gte = String(search.price_min)
  if (search.price_max !== undefined)
    params.price_lte = String(search.price_max)
  if (search.availability === 'in_stock') params.in_stock = true
  if (search.availability === 'out_of_stock') params.out_of_stock = true

  return params
}

export function toProductFiltersParams(
  search: ProductListingSearch,
  options?: {
    categoryId?: string
    sellerId?: string
  },
): ProductFiltersParams {
  const query: NonNullable<ProductFiltersParams['q']> = {}

  if (options?.categoryId) query.in_category = options.categoryId
  if (options?.sellerId) query.seller_id_eq = options.sellerId
  if (search.q) query.search = search.q
  if (search.option.length > 0) {
    query.with_option_value_ids = search.option
  }
  if (search.price_min !== undefined) query.price_gte = String(search.price_min)
  if (search.price_max !== undefined) query.price_lte = String(search.price_max)
  if (search.availability === 'in_stock') query.in_stock = true
  if (search.availability === 'out_of_stock') query.out_of_stock = true

  return { q: query }
}
