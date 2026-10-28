import type { ProductReview } from '@/lib/reviews/contracts'
import type {
  ReviewAnswerResponse,
  ReviewItemResponse,
  ReviewMediaResponse,
} from '../utils/review-item-response'
import { assertReviewItemResponse } from '../utils/review-item-response'
import { isReviewResourceId } from '../utils/review-product-identity'
import { asReviewRecord } from './product-review-values.mapper'

function mapReviewMedia(media: ReviewMediaResponse) {
  return {
    alt: media.alt?.trim() || null,
    id: media.id,
    position: media.position,
    url: media.url?.trim() || null,
  }
}

function mapReviewAnswer(answer: ReviewAnswerResponse) {
  return {
    id: answer.id,
    label: answer.label === null ? null : String(answer.label).trim() || null,
    questionId: answer.question_id,
    questionKey: answer.question_key,
    questionLabel: answer.question_label,
    value: answer.value,
  }
}

export function mapProductReview(value: unknown): ProductReview | null {
  if (!isReviewResourceId(asReviewRecord(value).id)) {
    return null
  }

  assertReviewItemResponse(value)
  const review: ReviewItemResponse = value

  return {
    answers: review.answers.map(mapReviewAnswer),
    body: review.body,
    createdAt: review.created_at,
    currentVote: review.current_vote,
    helpfulCount: review.helpful_count,
    id: review.id,
    media: review.media.map(mapReviewMedia),
    notHelpfulCount: review.not_helpful_count,
    productId: review.product_id,
    purchasedOptionValues: review.purchased_option_values
      .map((item) => item.trim())
      .filter(Boolean),
    rating: review.rating,
    reviewerName: review.reviewer_display_name?.trim() || null,
    title: review.title,
    variantId: review.variant_id,
    verifiedPurchase: review.verified_purchase,
  }
}
