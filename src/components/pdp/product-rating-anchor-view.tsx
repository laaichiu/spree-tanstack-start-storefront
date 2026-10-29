import { ReviewStarsView } from '@/components/reviews/review-stars-view'
import type { ProductRatingAnchorDisplay } from '@/components/reviews/product-rating-anchor-model'
import { Button } from '@/components/ui/button'

export function ProductRatingAnchorView({
  model,
}: {
  model: ProductRatingAnchorDisplay
}) {
  const { ariaLabel, label, rating, ratingLabel, targetId } = model

  function scrollToReviews() {
    const target = document.getElementById(targetId)

    if (!target) {
      return
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  return (
    <Button
      aria-controls={targetId}
      aria-label={ariaLabel}
      className="flex-wrap rounded-none border-0 p-0 text-muted-foreground normal-case hover:bg-transparent hover:text-foreground"
      onClick={scrollToReviews}
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
