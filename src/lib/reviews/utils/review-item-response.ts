import type {
  ProductReviewQuestionKind,
  ProductReviewRating,
} from '@/lib/reviews/contracts'

import {
  isReviewAnswerResourceId,
  isReviewMediaResourceId,
  isReviewProductResourceId,
  isReviewQuestionOptionResourceId,
  isReviewQuestionResourceId,
  isReviewResourceId,
  isReviewVariantResourceId,
} from './review-product-identity'

export const REVIEW_ITEM_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The product review response is malformed.'

export class ReviewItemResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_ITEM_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewItemResponseTypeMismatchError'
  }
}

export type ReviewMediaResponse = {
  alt: string | null
  id: string
  position: number
  url: string | null
}

export type ReviewAnswerResponse = {
  id: string
  kind: ProductReviewQuestionKind
  label: boolean | number | string | null
  option_id: string | null
  question_id: string
  question_key: string
  question_label: string
  value: boolean | number | string | null
}

export type ReviewItemResponse = {
  answers: ReviewAnswerResponse[]
  body: string
  created_at: string
  current_vote: 'helpful' | 'not_helpful' | null
  helpful_count: number
  id: string
  media: ReviewMediaResponse[]
  not_helpful_count: number
  product_id: string
  purchased_option_values: string[]
  rating: ProductReviewRating
  reviewer_display_name: string | null
  title: string
  variant_id: string | null
  verified_purchase: boolean
}

type UnknownRecord = Record<string, unknown>

const QUESTION_KINDS = new Set<ProductReviewQuestionKind>([
  'boolean',
  'multi_select',
  'scale',
  'single_select',
  'text',
])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isReviewRating(value: unknown): value is ProductReviewRating {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  )
}

function isReviewAnswerValue(
  value: unknown,
): value is boolean | number | string | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
}

function isReviewMediaResponse(value: unknown): value is ReviewMediaResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReviewMediaResourceId(value.id) &&
    isNonNegativeInteger(value.position) &&
    isNullableString(value.alt) &&
    isNullableString(value.url)
  )
}

function isReviewAnswerResponse(value: unknown): value is ReviewAnswerResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReviewAnswerResourceId(value.id) &&
    isReviewQuestionResourceId(value.question_id) &&
    isNonBlankString(value.question_key) &&
    isNonBlankString(value.question_label) &&
    typeof value.kind === 'string' &&
    QUESTION_KINDS.has(value.kind as ProductReviewQuestionKind) &&
    (value.option_id === null ||
      isReviewQuestionOptionResourceId(value.option_id)) &&
    isReviewAnswerValue(value.value) &&
    isReviewAnswerValue(value.label)
  )
}

export function isReviewItemResponse(
  value: unknown,
): value is ReviewItemResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isReviewResourceId(value.id) &&
    isReviewProductResourceId(value.product_id) &&
    (value.variant_id === null ||
      isReviewVariantResourceId(value.variant_id)) &&
    isNonBlankString(value.created_at) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isReviewRating(value.rating) &&
    isNonNegativeInteger(value.helpful_count) &&
    isNonNegativeInteger(value.not_helpful_count) &&
    typeof value.verified_purchase === 'boolean' &&
    (value.current_vote === null ||
      value.current_vote === 'helpful' ||
      value.current_vote === 'not_helpful') &&
    isNullableString(value.reviewer_display_name) &&
    Array.isArray(value.purchased_option_values) &&
    value.purchased_option_values.every(isNonBlankString) &&
    Array.isArray(value.media) &&
    value.media.every(isReviewMediaResponse) &&
    Array.isArray(value.answers) &&
    value.answers.every(isReviewAnswerResponse)
  )
}

export function assertReviewItemResponse(
  response: unknown,
): asserts response is ReviewItemResponse {
  if (!isReviewItemResponse(response)) {
    throw new ReviewItemResponseTypeMismatchError()
  }
}
