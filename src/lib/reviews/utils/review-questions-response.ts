export const REVIEW_QUESTIONS_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The product review questions response is malformed.'

export class ReviewQuestionsResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_QUESTIONS_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewQuestionsResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertReviewQuestionsResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new ReviewQuestionsResponseTypeMismatchError()
  }
}
