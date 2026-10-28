import type {
  ProductReviewQuestion,
  ProductReviewQuestionKind,
} from '@/lib/reviews/contracts'

import type {
  ProductReviewEligibility,
  ProductReviewFormState,
  ProductReviewMediaUpload,
} from '../model/product-review'
import {
  isReviewQuestionOptionResourceId,
  isReviewQuestionResourceId,
} from '../utils/review-product-identity'
import {
  assertReviewQuestionsResponse,
  ReviewQuestionsResponseTypeMismatchError,
} from '../utils/review-questions-response'
import { assertReviewEligibilityResponse } from '../utils/review-eligibility-response'
import { assertReviewMediaUploadResponse } from '../utils/review-media-upload-response'

type UnknownRecord = Record<string, unknown>

const QUESTION_KINDS = new Set<ProductReviewQuestionKind>([
  'boolean',
  'multi_select',
  'scale',
  'single_select',
  'text',
])

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {}
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown) {
  const normalized = asString(value).trim()

  return normalized || null
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function asRequiredString(value: unknown) {
  if (typeof value !== 'string') {
    throw new ReviewQuestionsResponseTypeMismatchError()
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new ReviewQuestionsResponseTypeMismatchError()
  }

  return normalized
}

export function mapProductReviewEligibility(
  value: unknown,
): ProductReviewEligibility {
  assertReviewEligibilityResponse(value)

  return {
    alreadyReviewed: value.already_reviewed,
    canReview: value.can_review,
    eligibleOrderId: asNullableString(value.eligible_order_id),
    orderId: asNullableString(value.order_id),
    productId: value.product_id.trim(),
    reason: asNullableString(value.reason),
    reviewId: asNullableString(value.review_id),
    variantId: asNullableString(value.variant_id),
    verifiedPurchase: value.verified_purchase,
  }
}

function mapReviewQuestionOption(value: unknown) {
  const option = asRecord(value)
  const id = asRequiredString(option.id)
  const label = asRequiredString(option.label)
  const optionValue = asRequiredString(option.value)

  if (!isReviewQuestionOptionResourceId(id)) {
    throw new ReviewQuestionsResponseTypeMismatchError()
  }

  return {
    id,
    label,
    value: optionValue,
  }
}

function isQuestionKind(value: unknown): value is ProductReviewQuestionKind {
  return (
    typeof value === 'string' &&
    QUESTION_KINDS.has(value as ProductReviewQuestionKind)
  )
}

function mapReviewQuestion(value: unknown): ProductReviewQuestion {
  const question = asRecord(value)
  const id = asRequiredString(question.id)
  const key = asRequiredString(question.key)
  const label = asRequiredString(question.label)
  const kind = question.kind

  if (
    !isReviewQuestionResourceId(id) ||
    !isQuestionKind(kind) ||
    !isBoolean(question.filterable) ||
    !isBoolean(question.required) ||
    !Array.isArray(question.options)
  ) {
    throw new ReviewQuestionsResponseTypeMismatchError()
  }

  return {
    filterable: question.filterable,
    id,
    key,
    kind,
    label,
    options: question.options.map(mapReviewQuestionOption),
    required: question.required,
  }
}

export function mapProductReviewFormState({
  eligibility,
  questions,
}: {
  eligibility: unknown
  questions: unknown
}): ProductReviewFormState {
  assertReviewQuestionsResponse(questions)

  return {
    eligibility: mapProductReviewEligibility(eligibility),
    questions: questions.data.map(mapReviewQuestion),
  }
}

export function mapProductReviewMediaUpload(
  value: unknown,
): ProductReviewMediaUpload {
  assertReviewMediaUploadResponse(value)

  return {
    headers: { ...value.direct_upload.headers },
    signedId: value.signed_id.trim(),
    url: value.direct_upload.url.trim(),
  }
}
