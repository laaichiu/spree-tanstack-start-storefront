import type { ProductReviewAnswerDisplay } from './review-answers'
import { getReviewAnswerDisplays } from './review-answers'
import type { ProductReview } from './product-review'

type ProductReviewMediaDisplay = Pick<
  ProductReview['media'][number],
  'alt' | 'id' | 'url'
>

/**
 * Stable review data for theme card presentation.
 *
 * Locale formatting, vote state mutations, and media selection remain outside
 * Core. This selector only normalizes nested answer and media relations into
 * the shape a review card needs to render.
 */
export type ProductReviewCardDisplay = Pick<
  ProductReview,
  | 'body'
  | 'createdAt'
  | 'currentVote'
  | 'helpfulCount'
  | 'notHelpfulCount'
  | 'purchasedOptionValues'
  | 'rating'
  | 'reviewerName'
  | 'title'
  | 'verifiedPurchase'
> & {
  answers: ProductReviewAnswerDisplay[]
  media: ProductReviewMediaDisplay[]
}

export function getProductReviewCardDisplay(
  review: ProductReview,
): ProductReviewCardDisplay {
  return {
    answers: getReviewAnswerDisplays(review.answers),
    body: review.body,
    createdAt: review.createdAt,
    currentVote: review.currentVote,
    helpfulCount: review.helpfulCount,
    media: review.media.map(({ alt, id, url }) => ({ alt, id, url })),
    notHelpfulCount: review.notHelpfulCount,
    purchasedOptionValues: review.purchasedOptionValues,
    rating: review.rating,
    reviewerName: review.reviewerName,
    title: review.title,
    verifiedPurchase: review.verifiedPurchase,
  }
}
