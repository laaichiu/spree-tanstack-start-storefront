import type { ProductReview } from '@/lib/reviews/contracts'
import type { ProductReviewMediaItem } from './review-media-items'
import { formatDate } from '@/components/shared/locale-format'

type ProductReviewMediaDisplay = Pick<
  ProductReviewMediaItem['media'],
  'alt' | 'id' | 'url'
>

export type ProductReviewMediaLightboxDisplay = {
  id: string
  media: ProductReviewMediaDisplay
  review: Pick<
    ProductReview,
    | 'body'
    | 'createdAt'
    | 'purchasedOptionValues'
    | 'rating'
    | 'reviewerName'
    | 'title'
    | 'verifiedPurchase'
  > & {
    createdAtLabel: string
  }
}

export function getReviewMediaLightboxDisplays(
  items: readonly ProductReviewMediaItem[],
  locale: string,
): ProductReviewMediaLightboxDisplay[] {
  return items.map(({ id, media, review }) => ({
    id,
    media: {
      alt: media.alt,
      id: media.id,
      url: media.url,
    },
    review: {
      body: review.body,
      createdAt: review.createdAt,
      createdAtLabel: formatDate(review.createdAt, locale),
      purchasedOptionValues: review.purchasedOptionValues,
      rating: review.rating,
      reviewerName: review.reviewerName,
      title: review.title,
      verifiedPurchase: review.verifiedPurchase,
    },
  }))
}
