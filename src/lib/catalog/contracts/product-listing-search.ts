import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  DEFAULT_PRODUCT_LISTING_SORT,
  isProductListingAvailability,
  isProductListingSort,
} from './product-listing'
import type {
  ProductListingAvailability,
  ProductListingSearch,
  ProductListingSort,
} from './product-listing'

const MAX_PRODUCT_LISTING_LIMIT = 48

function parsePositiveInt(value: unknown, fallback: number): number {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value.trim())
        : Number.NaN
  const integer = Math.floor(numeric)

  if (!Number.isFinite(integer) || integer <= 0) {
    return fallback
  }

  return integer
}

function parseNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : undefined
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  if (trimmedValue.length === 0) {
    return undefined
  }

  const numeric = Number(trimmedValue)

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

  return isProductListingSort(sort) ? sort : DEFAULT_PRODUCT_LISTING_SORT
}

function parseAvailability(
  value: unknown,
): ProductListingAvailability | undefined {
  const availability = parseString(value)

  return isProductListingAvailability(availability) ? availability : undefined
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
      MAX_PRODUCT_LISTING_LIMIT,
    ),
    sort: parseProductListingSort(search.sort),
    option: [...new Set(rawOptionValues)],
    availability: parseAvailability(search.availability),
    price_min: parseNonNegativeNumber(search.price_min ?? search.price_gte),
    price_max: parseNonNegativeNumber(search.price_max ?? search.price_lte),
  }
}
