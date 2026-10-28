export const REVIEW_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The review list response is malformed.'

export class ReviewListResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewListResponseTypeMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

export type ReviewListPaginationResponse = {
  count: number
  limit: number
  next: number | null
  page: number
  pages: number
  previous: number | null
}

export type ReviewListResponse = {
  data: unknown[]
  meta: ReviewListPaginationResponse
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value)
}

function isReviewListPaginationResponse(
  value: unknown,
): value is ReviewListPaginationResponse {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.count) &&
    isPositiveInteger(value.limit) &&
    isNullablePositiveInteger(value.next) &&
    isPositiveInteger(value.page) &&
    isNonNegativeInteger(value.pages) &&
    isNullablePositiveInteger(value.previous)
  )
}

export function assertReviewListResponse(
  response: unknown,
): asserts response is ReviewListResponse {
  if (
    !isRecord(response) ||
    !Array.isArray(response.data) ||
    !isReviewListPaginationResponse(response.meta)
  ) {
    throw new ReviewListResponseTypeMismatchError()
  }
}
