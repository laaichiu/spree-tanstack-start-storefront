import { ReviewStarsView } from '@/components/reviews/review-stars-view'
import type { ProductRatingAnchorDisplay } from '@/components/reviews/product-rating-anchor-model'
import { scrollToProductReviewTarget } from '@/components/reviews/product-reviews-scroll'
import { Button } from '@/components/ui/button'

export function ProductRatingAnchorView({
  model,
}: {
  model: ProductRatingAnchorDisplay
}) {
  const { ariaLabel, label, rating, ratingLabel, targetId } = model

  return (
    <Button
      aria-controls={targetId}
      aria-label={ariaLabel}
      className="flex-wrap rounded-none border-0 p-0 text-muted-foreground normal-case hover:bg-transparent hover:text-foreground"
      onClick={() => scrollToProductReviewTarget(targetId)}
      variant="ghost"
    >
      <ReviewStarsView
        className="gap-0.5 [&>svg]:size-3"
        label={ratingLabel}
        rating={rating}
      />
      <span className="text-xs leading-4">{label}</span>
    </Button>
  )
}
