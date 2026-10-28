import { useMarket } from '@/components/layout/market-provider'
import { getProductReviewSummaryDisplay } from './product-review-summary-model'
import type { ProductReviewSummary } from '@/lib/reviews/contracts'

import { ProductReviewSummaryView } from './product-review-summary-view'

export function ProductReviewSummaryPanel({
  summary,
}: {
  summary: ProductReviewSummary
}) {
  const { market, t } = useMarket()
  const display = getProductReviewSummaryDisplay({
    labels: {
      overallRating: t('reviews.overallRating'),
      reviewPlural: t('reviews.reviewPlural'),
      reviewSingular: t('reviews.reviewSingular'),
    },
    locale: market.locale,
    summary,
  })

  return <ProductReviewSummaryView model={display} />
}
