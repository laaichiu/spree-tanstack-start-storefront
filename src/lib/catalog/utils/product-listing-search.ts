import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  DEFAULT_PRODUCT_LISTING_SORT,
  PRODUCT_LISTING_AVAILABILITY_VALUES,
  PRODUCT_LISTING_SORT_VALUES,
} from '@/lib/catalog/model/product-listing'
import type {
  ProductListingAvailability,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/model/product-listing'

const PRODUCT_LISTING_SORT_SET = new Set<string>(PRODUCT_LISTING_SORT_VALUES)
const PRODUCT_LISTING_AVAILABILITY_SET = new Set<string>(
  PRODUCT_LISTING_AVAILABILITY_VALUES,
)
const MAX_PRODUCTS_ROUTE_LIMIT = 48

function parsePositiveInt(value: unknown, fallback: number): number {
  const numeric = Number(value)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback
  }

  return Math.floor(numeric)
}

function parseNonNegativeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const numeric = Number(value)

  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined
}

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmedValue = value.trim()

  if (trimmedValue.startsWith('[')) {
    try {
      return parseStringArray(JSON.parse(trimmedValue))
    } catch {
      return []
    }
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseProductListingSort(value: unknown): ProductListingSort {
  const sort = parseString(value)

  return PRODUCT_LISTING_SORT_SET.has(sort)
    ? (sort as ProductListingSort)
    : DEFAULT_PRODUCT_LISTING_SORT
}

function parseAvailability(
  value: unknown,
): ProductListingAvailability | undefined {
  const availability = parseString(value)

  return PRODUCT_LISTING_AVAILABILITY_SET.has(availability)
    ? (availability as ProductListingAvailability)
    : undefined
}

export function parseProductListingSearch(
  search: Record<string, unknown>,
): ProductListingSearch {
  const query = parseString(search.q ?? search.query ?? search.search)
  const rawOptionValues = parseStringArray(
    search.option ?? search.with_option_value_ids ?? search.option_values,
  )

  return {
    q: query || undefined,
    page: parsePositiveInt(search.page, DEFAULT_PRODUCT_LISTING_SEARCH.page),
    limit: Math.min(
      parsePositiveInt(search.limit, DEFAULT_PRODUCT_LISTING_SEARCH.limit),
      MAX_PRODUCTS_ROUTE_LIMIT,
    ),
    sort: parseProductListingSort(search.sort),
    option: [...new Set(rawOptionValues)],
    availability: parseAvailability(search.availability),
    price_min: parseNonNegativeNumber(search.price_min ?? search.price_gte),
    price_max: parseNonNegativeNumber(search.price_max ?? search.price_lte),
  }
}

export function getActiveFilterCount(search: ProductListingSearch): number {
  return (
    search.option.length +
    (search.availability ? 1 : 0) +
    (search.price_min !== undefined || search.price_max !== undefined ? 1 : 0)
  )
}
