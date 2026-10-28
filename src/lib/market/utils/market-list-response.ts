export const MARKET_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The market list response is malformed.'

export class MarketListResponseTypeMismatchError extends Error {
  constructor() {
    super(MARKET_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'MarketListResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertMarketListResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new MarketListResponseTypeMismatchError()
  }
}
