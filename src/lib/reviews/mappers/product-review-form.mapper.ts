import type {
  ProductReviewEligibility,
  ProductReviewFormState,
  ProductReviewMediaUpload,
  ProductReviewQuestion,
  ProductReviewQuestionKind,
} from '../model/product-review'

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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown) {
  const normalized = asString(value).trim()

  return normalized || null
}

function asBoolean(value: unknown) {
  return value === true
}

export function mapProductReviewEligibility(
  value: unknown,
): ProductReviewEligibility {
  const eligibility = asRecord(value)

  return {
    alreadyReviewed: asBoolean(eligibility.already_reviewed),
    canReview: asBoolean(eligibility.can_review),
    eligibleOrderId: asNullableString(eligibility.eligible_order_id),
    orderId: asNullableString(eligibility.order_id),
    productId: asString(eligibility.product_id),
    reason: asNullableString(eligibility.reason),
    reviewId: asNullableString(eligibility.review_id),
    variantId: asNullableString(eligibility.variant_id),
    verifiedPurchase: asBoolean(eligibility.verified_purchase),
  }
}

function mapReviewQuestion(value: unknown): ProductReviewQuestion | null {
  const question = asRecord(value)
  const id = asString(question.id).trim()
  const key = asString(question.key).trim()
  const kind = asString(question.kind) as ProductReviewQuestionKind

  if (!id || !key || !QUESTION_KINDS.has(kind)) {
    return null
  }

  return {
    filterable: asBoolean(question.filterable),
    id,
    key,
    kind,
    label: asString(question.label, key),
    options: asArray(question.options).flatMap((item) => {
      const option = asRecord(item)
      const optionId = asString(option.id).trim()
      const optionValue = asString(option.value).trim()

      return optionId && optionValue
        ? [
            {
              id: optionId,
              label: asString(option.label, optionValue),
              value: optionValue,
            },
          ]
        : []
    }),
    required: asBoolean(question.required),
  }
}

export function mapProductReviewFormState({
  eligibility,
  questions,
}: {
  eligibility: unknown
  questions: unknown
}): ProductReviewFormState {
  return {
    eligibility: mapProductReviewEligibility(eligibility),
    questions: asArray(asRecord(questions).data)
      .map(mapReviewQuestion)
      .filter(
        (question): question is ProductReviewQuestion => question !== null,
      ),
  }
}

export function mapProductReviewMediaUpload(
  value: unknown,
): ProductReviewMediaUpload {
  const response = asRecord(value)
  const directUpload = asRecord(response.direct_upload)
  const headers = Object.fromEntries(
    Object.entries(asRecord(directUpload.headers)).flatMap(([key, item]) =>
      typeof item === 'string' ? [[key, item]] : [],
    ),
  )

  return {
    headers,
    signedId: asString(response.signed_id),
    url: asString(directUpload.url),
  }
}
