import { ReviewStarsView } from '@/components/reviews/review-stars-view'
import type { ProductRatingAnchorDisplay } from '@/components/reviews/product-rating-anchor-model'

export function ProductRatingAnchorView({
  model,
}: {
  model: ProductRatingAnchorDisplay
}) {
  const { ariaLabel, href, label, rating, ratingLabel } = model

  return (
    <a
      aria-label={ariaLabel}
      className="mt-5 inline-flex flex-wrap items-center gap-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      href={href}
    >
      <ReviewStarsView label={ratingLabel} rating={rating} />
      <span className="text-xs leading-6">{label}</span>
    </a>
  )
}
