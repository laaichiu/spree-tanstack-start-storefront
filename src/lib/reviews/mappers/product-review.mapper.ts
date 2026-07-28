import {
  PRODUCT_REVIEWS_PAGE_SIZE,
  PRODUCT_REVIEW_RATINGS,
} from '../model/product-review'
import type {
  ProductReview,
  ProductReviewAnswer,
  ProductReviewFilter,
  ProductReviewFilters,
  ProductReviewMedia,
  ProductReviewRating,
  ProductReviewsPage,
  ProductReviewSort,
  ProductReviewSummary,
  ProductReviewVote,
} from '../model/product-review'

type UnknownRecord = Record<string, unknown>

const REVIEW_SORTS = new Set<ProductReviewSort>([
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
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

function asNumber(value: unknown, fallback = 0) {
  const normalized = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(normalized) ? normalized : fallback
}

function asCount(value: unknown) {
  return Math.max(0, Math.trunc(asNumber(value)))
}

function asBoolean(value: unknown) {
  return value === true
}

function asRating(value: unknown): ProductReviewRating {
  const rating = Math.round(asNumber(value, 1))

  return Math.min(5, Math.max(1, rating)) as ProductReviewRating
}

function asVote(value: unknown): ProductReviewVote | null {
  return value === 'helpful' || value === 'not_helpful' ? value : null
}

function asSort(value: unknown): ProductReviewSort | null {
  return typeof value === 'string' &&
    REVIEW_SORTS.has(value as ProductReviewSort)
    ? (value as ProductReviewSort)
    : null
}

function mapReviewMedia(value: unknown, index: number): ProductReviewMedia {
  const media = asRecord(value)

  return {
    alt: asNullableString(media.alt),
    id: asString(media.id, `review-media-${index}`),
    position: asCount(media.position),
    url: asNullableString(media.url),
  }
}

function mapReviewAnswer(value: unknown, index: number): ProductReviewAnswer {
  const answer = asRecord(value)
  const rawValue = answer.value

  return {
    id: asString(answer.id, `review-answer-${index}`),
    label: asNullableString(answer.label),
    questionId: asString(answer.question_id),
    questionKey: asString(answer.question_key),
    questionLabel: asString(answer.question_label),
    value:
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean'
        ? rawValue
        : null,
  }
}

export function mapProductReview(value: unknown): ProductReview | null {
  const review = asRecord(value)
  const id = asString(review.id).trim()

  if (!id) {
    return null
  }

  return {
    answers: asArray(review.answers).map(mapReviewAnswer),
    body: asString(review.body),
    createdAt: asString(review.created_at),
    currentVote: asVote(review.current_vote),
    helpfulCount: asCount(review.helpful_count),
    id,
    media: asArray(review.media).map(mapReviewMedia),
    notHelpfulCount: asCount(review.not_helpful_count),
    productId: asString(review.product_id),
    purchasedOptionValues: asArray(review.purchased_option_values)
      .map((item) => asString(item).trim())
      .filter(Boolean),
    rating: asRating(review.rating),
    reviewerName: asNullableString(review.reviewer_display_name),
    title: asString(review.title),
    variantId: asNullableString(review.variant_id),
    verifiedPurchase: asBoolean(review.verified_purchase),
  }
}

export function mapProductReviewSummary(
  value: unknown,
  fallbackProductId: string,
): ProductReviewSummary {
  const summary = asRecord(value)
  const distribution = asRecord(summary.rating_distribution)

  return {
    averageRating: Math.min(5, Math.max(0, asNumber(summary.average_rating))),
    productId: asString(summary.product_id, fallbackProductId),
    ratingDistribution: Object.fromEntries(
      PRODUCT_REVIEW_RATINGS.map((rating) => [
        rating,
        asCount(distribution[String(rating)]),
      ]),
    ) as Record<ProductReviewRating, number>,
    reviewCount: asCount(summary.reviews_count),
  }
}

export function mapProductReviewsPage(value: unknown): ProductReviewsPage {
  const response = asRecord(value)
  const meta = asRecord(response.meta)
  const page = Math.max(1, asCount(meta.page) || 1)
  const limit = Math.max(1, asCount(meta.limit) || PRODUCT_REVIEWS_PAGE_SIZE)

  return {
    pagination: {
      count: asCount(meta.count),
      limit,
      nextPage: meta.next === null ? null : asCount(meta.next) || null,
      page,
      pageCount: asCount(meta.pages),
      previousPage:
        meta.previous === null ? null : asCount(meta.previous) || null,
    },
    reviews: asArray(response.data)
      .map(mapProductReview)
      .filter((review): review is ProductReview => review !== null),
  }
}

function mapReviewFilter(value: unknown): ProductReviewFilter | null {
  const filter = asRecord(value)
  const id = asString(filter.id).trim()

  if (!id) {
    return null
  }

  return {
    id,
    label: asString(filter.label, id),
    type: asString(filter.type),
    values: asArray(filter.values).flatMap((item) => {
      const option = asRecord(item)
      const optionValue = asString(option.value).trim()

      return optionValue
        ? [
            {
              count: asCount(option.count),
              label: asString(option.label, optionValue),
              value: optionValue,
            },
          ]
        : []
    }),
  }
}

export function mapProductReviewFilters(value: unknown): ProductReviewFilters {
  const response = asRecord(value)
  const sortOptions = asArray(response.sort_options)
    .map((item) => asSort(asRecord(item).id))
    .filter((sort): sort is ProductReviewSort => sort !== null)

  return {
    defaultSort: asSort(response.default_sort) ?? 'most_recent',
    filters: asArray(response.filters)
      .map(mapReviewFilter)
      .filter((filter): filter is ProductReviewFilter => filter !== null),
    sortOptions: sortOptions.length ? sortOptions : ['most_recent'],
  }
}
