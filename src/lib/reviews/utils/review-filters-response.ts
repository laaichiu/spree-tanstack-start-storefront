import type { ProductReviewSort } from '@/lib/reviews/contracts'

export const REVIEW_FILTERS_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The product review filters response is malformed.'

export class ReviewFiltersResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_FILTERS_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewFiltersResponseTypeMismatchError'
  }
}

export type ReviewFilterValueResponse = {
  count: number
  label: string
  value: string
}

export type ReviewFilterResponse = {
  id: string
  label: string
  type: string
  values: ReviewFilterValueResponse[]
}

export type ReviewFiltersResponse = {
  default_sort: ProductReviewSort
  filters: ReviewFilterResponse[]
  sort_options: Array<{ id: ProductReviewSort; label: string }>
}

type UnknownRecord = Record<string, unknown>

const REVIEW_SORTS = new Set<ProductReviewSort>([
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isReviewSort(value: unknown): value is ProductReviewSort {
  return (
    typeof value === 'string' && REVIEW_SORTS.has(value as ProductReviewSort)
  )
}

function isReviewFilterValueResponse(
  value: unknown,
): value is ReviewFilterValueResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.value) &&
    isNonBlankString(value.label) &&
    isNonNegativeInteger(value.count)
  )
}

function isReviewFilterResponse(value: unknown): value is ReviewFilterResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.label) &&
    isNonBlankString(value.type) &&
    Array.isArray(value.values) &&
    value.values.every(isReviewFilterValueResponse)
  )
}

export function assertReviewFiltersResponse(
  response: unknown,
): asserts response is ReviewFiltersResponse {
  if (
    !isRecord(response) ||
    !isReviewSort(response.default_sort) ||
    !Array.isArray(response.filters) ||
    !response.filters.every(isReviewFilterResponse) ||
    !Array.isArray(response.sort_options) ||
    !response.sort_options.every(
      (option) =>
        isRecord(option) &&
        isReviewSort(option.id) &&
        isNonBlankString(option.label),
    )
  ) {
    throw new ReviewFiltersResponseTypeMismatchError()
  }
}
