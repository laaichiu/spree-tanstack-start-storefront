import { PRODUCT_REVIEW_RATINGS } from '@/lib/reviews/contracts'
import type {
  ProductReviewRating,
  ProductReviewSort,
} from '@/lib/reviews/contracts'

export type UnknownReviewRecord = Record<string, unknown>

export const REVIEW_SORTS = new Set<ProductReviewSort>([
  'most_recent',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
])

export function asReviewRecord(value: unknown): UnknownReviewRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownReviewRecord)
    : {}
}

export function asReviewArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function asReviewString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asNullableReviewString(value: unknown) {
  const normalized = asReviewString(value).trim()

  return normalized || null
}

export function asReviewNumber(value: unknown, fallback = 0) {
  const normalized = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(normalized) ? normalized : fallback
}

export function asReviewCount(value: unknown) {
  return Math.max(0, Math.trunc(asReviewNumber(value)))
}

export function asReviewBoolean(value: unknown) {
  return value === true
}

export function asReviewRating(value: unknown): ProductReviewRating {
  const rating = Math.round(asReviewNumber(value, 1))

  return Math.min(5, Math.max(1, rating)) as ProductReviewRating
}

export function asReviewVote(value: unknown) {
  return value === 'helpful' || value === 'not_helpful' ? value : null
}

export function asReviewSort(value: unknown): ProductReviewSort | null {
  return typeof value === 'string' &&
    REVIEW_SORTS.has(value as ProductReviewSort)
    ? (value as ProductReviewSort)
    : null
}

export { PRODUCT_REVIEW_RATINGS }
