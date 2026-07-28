import { useMarket } from '@/components/layout/market-provider'
import { formatNumber } from '@/lib/i18n/messages'
import { PRODUCT_REVIEW_RATINGS } from '@/lib/reviews/model/product-review'
import type { ProductReviewSummary } from '@/lib/reviews/model/product-review'

import { formatReviewRating, ReviewStars } from './review-stars'

export function ProductReviewSummaryPanel({
  summary,
}: {
  summary: ProductReviewSummary
}) {
  const { market, t } = useMarket()
  const maxRatingCount = Math.max(
    1,
    ...PRODUCT_REVIEW_RATINGS.map(
      (rating) => summary.ratingDistribution[rating],
    ),
  )
  const countLabel = `${formatNumber(summary.reviewCount, market.locale)} ${
    summary.reviewCount === 1
      ? t('reviews.reviewSingular')
      : t('reviews.reviewPlural')
  }`

  return (
    <div className="bg-muted px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
        <div className="space-y-4">
          <p className="text-lg leading-6 font-normal text-foreground">
            {formatReviewRating(summary.averageRating)}{' '}
            {t('reviews.overallRating')}
          </p>
          <ReviewStars
            className="text-lg leading-none"
            label={`${formatReviewRating(summary.averageRating)} / 5`}
            rating={summary.averageRating}
          />
          <p className="text-sm leading-4 font-normal tracking-wider text-foreground uppercase">
            {countLabel}
          </p>
        </div>

        <div className="space-y-3">
          {PRODUCT_REVIEW_RATINGS.map((rating) => {
            const count = summary.ratingDistribution[rating]
            const width = `${Math.round((count / maxRatingCount) * 100)}%`

            return (
              <div
                className="grid grid-cols-[1.5rem_1rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm text-foreground"
                key={rating}
              >
                <span>{rating}</span>
                <span aria-hidden="true">★</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width }}
                  />
                </div>
                <span className="text-right text-foreground">
                  {formatNumber(count, market.locale)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
