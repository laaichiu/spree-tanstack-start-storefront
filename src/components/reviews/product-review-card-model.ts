import { getProductReviewCardDisplay } from '@/lib/reviews/contracts'
import type {
  ProductReview,
  ProductReviewCardDisplay,
} from '@/lib/reviews/contracts'
import { formatDate, formatNumber } from '@/components/shared/locale-format'

export type ProductReviewCardPresentationLabels = {
  anonymous: string
  customerPhoto: string
  helpful: string
  notHelpful: string
  openPhoto: string
  purchasedOptions: string
  verifiedBuyer: string
  voteFailed: string
}

export type ProductReviewCardPresentation = {
  createdAtLabel?: string
  helpfulCountLabel: string
  labels: ProductReviewCardPresentationLabels
  notHelpfulCountLabel: string
  review: Omit<ProductReviewCardDisplay, 'helpfulCount' | 'notHelpfulCount'>
}

export function getProductReviewCardPresentation({
  labels,
  locale,
  review,
}: {
  labels: ProductReviewCardPresentationLabels
  locale: string
  review: ProductReview
}): ProductReviewCardPresentation {
  const display = getProductReviewCardDisplay(review)

  return {
    createdAtLabel: display.createdAt
      ? formatDate(display.createdAt, locale)
      : undefined,
    helpfulCountLabel: formatNumber(display.helpfulCount, locale),
    labels,
    notHelpfulCountLabel: formatNumber(display.notHelpfulCount, locale),
    review: {
      answers: display.answers,
      body: display.body,
      createdAt: display.createdAt,
      currentVote: display.currentVote,
      media: display.media,
      purchasedOptionValues: display.purchasedOptionValues,
      rating: display.rating,
      reviewerName: display.reviewerName,
      title: display.title,
      verifiedPurchase: display.verifiedPurchase,
    },
  }
}
