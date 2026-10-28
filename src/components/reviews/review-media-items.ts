import type { ProductReview, ProductReviewMedia } from '@/lib/reviews/contracts'

type ProductReviewMediaWithUrl = Omit<ProductReviewMedia, 'url'> & {
  url: string
}

export type ProductReviewMediaItem = {
  id: string
  media: ProductReviewMediaWithUrl
  review: ProductReview
}

export function getReviewMediaItemId(
  review: Pick<ProductReview, 'id'>,
  media: Pick<ProductReviewMedia, 'id'>,
) {
  return `${review.id}:${media.id}`
}

function hasUsableUrl(
  media: ProductReviewMedia,
): media is ProductReviewMediaWithUrl {
  return Boolean(media.url)
}

/**
 * Flattens review media into the items consumed by this theme's lightbox.
 * Media without a usable URL remains in the normalized review contract but is
 * not rendered as an interactive lightbox item.
 */
export function getReviewMediaItems(
  reviews: readonly ProductReview[],
): ProductReviewMediaItem[] {
  return reviews.flatMap((review) =>
    review.media.filter(hasUsableUrl).map((media) => ({
      id: getReviewMediaItemId(review, media),
      media,
      review,
    })),
  )
}
