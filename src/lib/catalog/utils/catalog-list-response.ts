export const CATALOG_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The catalog list response is malformed.'

export class CatalogListResponseTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogListResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertCatalogListResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new CatalogListResponseTypeMismatchError()
  }
}
