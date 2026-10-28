import type {
  ProductReviewQuestion,
  ProductReviewRating,
} from '@/lib/reviews/contracts'

/**
 * Runtime-only review contracts.
 *
 * Review display, query, and normalized API contracts are owned by the
 * reviews feature. Eligibility, form, upload, and submission contracts stay
 * here because they cross customer or mutation boundaries.
 */
export type ProductReviewEligibility = {
  alreadyReviewed: boolean
  canReview: boolean
  eligibleOrderId: string | null
  orderId: string | null
  productId: string
  reason: string | null
  reviewId: string | null
  variantId: string | null
  verifiedPurchase: boolean
}

export type ProductReviewFormState = {
  eligibility: ProductReviewEligibility
  questions: ProductReviewQuestion[]
}

export type ProductReviewMediaUpload = {
  headers: Record<string, string>
  signedId: string
  url: string
}

export type SubmitProductReviewInput = {
  answers: Record<string, string | string[]>
  body: string
  media: Array<{ alt: string; signedId: string }>
  orderId: string
  productId: string
  rating: ProductReviewRating
  title: string
  variantId: string
}
