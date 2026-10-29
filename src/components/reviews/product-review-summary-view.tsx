import { ReviewStarsView } from './review-stars-view'
import { ReviewStarIcon } from './review-star-icon'
import type { ProductReviewSummaryDisplay } from './product-review-summary-model'
import { PRODUCT_REVIEWS_SUMMARY_ID } from './product-reviews-target-ids'

export function ProductReviewSummaryView({
  model,
}: {
  model: ProductReviewSummaryDisplay
}) {
  const {
    averageRating,
    ratingLabel,
    overallRatingLabel,
    ratingBars,
    reviewCountLabel,
  } = model
  return (
    <div
      className="scroll-mt-24 bg-muted px-6 py-8 sm:px-8 lg:px-10 lg:py-10"
      id={PRODUCT_REVIEWS_SUMMARY_ID}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
        <div className="space-y-4">
          <p className="text-xs leading-6 font-normal text-foreground">
            {overallRatingLabel}
          </p>
          <ReviewStarsView
            className="text-base leading-none"
            label={ratingLabel}
            rating={averageRating}
          />
          <p className="text-xs leading-4 font-normal tracking-wider text-foreground uppercase">
            {reviewCountLabel}
          </p>
        </div>

        <div className="space-y-3">
          {ratingBars.map(({ countLabel, rating, widthPercent }) => (
            <div
              className="grid grid-cols-[1.5rem_1rem_minmax(0,1fr)_2rem] items-center gap-3 text-xs text-foreground"
              key={rating}
            >
              <span>{rating}</span>
              <ReviewStarIcon />
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-right text-foreground">{countLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
