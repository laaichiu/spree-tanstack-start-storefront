export const CART_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The cart list response is malformed.'

export class CartListResponseTypeMismatchError extends Error {
  constructor() {
    super(CART_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CartListResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isCartListResponseTypeMismatchError(
  error: unknown,
): error is CartListResponseTypeMismatchError {
  return error instanceof CartListResponseTypeMismatchError
}

export function assertCartListResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new CartListResponseTypeMismatchError()
  }
}
