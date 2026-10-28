export const CUSTOMER_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The customer list response is malformed.'

export class CustomerListResponseTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerListResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertCustomerListResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new CustomerListResponseTypeMismatchError()
  }
}
