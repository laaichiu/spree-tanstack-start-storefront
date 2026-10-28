import type { ProductReviewCardPresentation } from '@/components/reviews/product-review-card-model'

export type ProductReviewCardMedia = {
  alt: string | null
  id: string
  url: string | null
}

export type ProductReviewVoteAction = 'helpful' | 'not_helpful'

export type ProductReviewCardModel = ProductReviewCardPresentation & {
  failedVote: boolean
  pendingVote: boolean
}

export type ProductReviewCardActions = {
  mediaClick: (media: ProductReviewCardMedia) => void
  vote: (vote: ProductReviewVoteAction) => void
}

export type ProductReviewCardProps = {
  model: ProductReviewCardModel
  actions: ProductReviewCardActions
}
