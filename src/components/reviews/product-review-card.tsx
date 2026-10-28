import { useMarket } from '@/components/layout/market-provider'
import { getProductReviewCardPresentation } from './product-review-card-model'
import type { ProductReview, ProductReviewVote } from '@/lib/reviews/contracts'

import { ProductReviewCardView } from './product-review-card-view'
import { getReviewMediaItemId } from './review-media-items'

export function ProductReviewCard({
  failedVote,
  onMediaClick,
  onVote,
  pendingVote,
  review,
}: {
  failedVote: boolean
  onMediaClick: (mediaId: string) => void
  onVote: (vote: ProductReviewVote) => void
  pendingVote: boolean
  review: ProductReview
}) {
  const { market, t } = useMarket()
  const display = getProductReviewCardPresentation({
    labels: {
      anonymous: t('reviews.anonymous'),
      customerPhoto: t('reviews.customerPhoto'),
      helpful: t('reviews.helpful'),
      notHelpful: t('reviews.notHelpful'),
      openPhoto: t('reviews.openPhoto'),
      purchasedOptions: t('reviews.purchasedOptions'),
      verifiedBuyer: t('reviews.verifiedBuyer'),
      voteFailed: t('reviews.voteFailed'),
    },
    locale: market.locale,
    review,
  })

  return (
    <ProductReviewCardView
      model={{
        ...display,
        failedVote,
        pendingVote,
      }}
      actions={{
        mediaClick: (media) =>
          onMediaClick(getReviewMediaItemId(review, media)),
        vote: onVote,
      }}
    />
  )
}
