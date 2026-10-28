import type {
  PriceRangeFilter as SpreePriceRangeFilter,
  ProductFiltersResponse as SpreeProductFiltersResponse,
} from '@spree/sdk'

// Facets are numeric UI bounds. RC1 sends JSON numbers; RC3 sends decimal
// strings. Keep this compatibility local to facets, not commerce money fields.
export type CatalogPriceRangeFilter = Omit<
  SpreePriceRangeFilter,
  'min' | 'max'
> & { min: string | number; max: string | number }

type CatalogProductFilter =
  | Exclude<
      SpreeProductFiltersResponse['filters'][number],
      SpreePriceRangeFilter
    >
  | CatalogPriceRangeFilter

export type CatalogProductFiltersResponse = Omit<
  SpreeProductFiltersResponse,
  'filters'
> & { filters: CatalogProductFilter[] }

export const CATALOG_PRODUCT_FILTERS_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The catalog product filters response is malformed.'

export class CatalogProductFiltersResponseTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_PRODUCT_FILTERS_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogProductFiltersResponseTypeMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0
}

function isNonNegativeAmount(value: unknown): value is string | number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0
  }

  return (
    typeof value === 'string' &&
    /^\d+(?:\.\d+)?$/.test(value) &&
    Number.isFinite(Number(value))
  )
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isAvailabilityOption(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isNonNegativeInteger(value.count)
  )
}

function isCategoryOption(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isNonBlankString(value.name) &&
    isNonBlankString(value.permalink) &&
    isNonNegativeInteger(value.count)
  )
}

function isOptionFilterOption(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isNonBlankString(value.name) &&
    isNonBlankString(value.label) &&
    isNonNegativeInteger(value.position) &&
    isNullableString(value.color_code) &&
    isNullableString(value.image_url) &&
    isNonNegativeInteger(value.count)
  )
}

function isProductFilter(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  switch (value.type) {
    case 'availability':
      return (
        value.id === 'availability' &&
        Array.isArray(value.options) &&
        value.options.every(isAvailabilityOption)
      )
    case 'category':
      return (
        value.id === 'categories' &&
        Array.isArray(value.options) &&
        value.options.every(isCategoryOption)
      )
    case 'option':
      return (
        isNonBlankString(value.id) &&
        isNonBlankString(value.name) &&
        isNonBlankString(value.label) &&
        isNonBlankString(value.kind) &&
        Array.isArray(value.options) &&
        value.options.every(isOptionFilterOption)
      )
    case 'price_range':
      return (
        value.id === 'price' &&
        isNonNegativeAmount(value.min) &&
        isNonNegativeAmount(value.max) &&
        Number(value.max) >= Number(value.min) &&
        isNonBlankString(value.currency)
      )
    default:
      return false
  }
}

function isSortOption(value: unknown) {
  return isRecord(value) && isNonBlankString(value.id)
}

export function assertCatalogProductFiltersResponse(
  response: unknown,
): asserts response is CatalogProductFiltersResponse {
  if (
    !isRecord(response) ||
    !Array.isArray(response.filters) ||
    !response.filters.every(isProductFilter) ||
    !Array.isArray(response.sort_options) ||
    !response.sort_options.every(isSortOption) ||
    !isNonBlankString(response.default_sort) ||
    !isNonNegativeInteger(response.total_count)
  ) {
    throw new CatalogProductFiltersResponseTypeMismatchError()
  }
}
