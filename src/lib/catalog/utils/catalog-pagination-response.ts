export const CATALOG_PAGINATION_META_TYPE_MISMATCH_MESSAGE =
  'The catalog pagination metadata is malformed.'

export class CatalogPaginationMetaTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_PAGINATION_META_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogPaginationMetaTypeMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function hasPageCount(value: unknown): value is { pages: number } {
  return isRecord(value) && isNonNegativeInteger(value.pages)
}

function isListingPaginationMeta(value: unknown) {
  return (
    isRecord(value) &&
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.limit) &&
    isNonNegativeInteger(value.count) &&
    isNonNegativeInteger(value.pages) &&
    isNonNegativeInteger(value.from) &&
    isNonNegativeInteger(value.to)
  )
}

export function assertCatalogListingPaginationMeta(
  meta: unknown,
): asserts meta is {
  count: number
  from: number
  limit: number
  page: number
  pages: number
  to: number
} {
  if (!isListingPaginationMeta(meta)) {
    throw new CatalogPaginationMetaTypeMismatchError()
  }
}

export function assertCatalogPaginationPageCount(
  meta: unknown,
): asserts meta is { pages: number } {
  if (!hasPageCount(meta)) {
    throw new CatalogPaginationMetaTypeMismatchError()
  }
}
