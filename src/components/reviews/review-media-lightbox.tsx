import { useMarket } from '@/components/layout/market-provider'
import { getReviewMediaLightboxDisplays } from './review-media-lightbox-model'
import type { ProductReviewMediaItem } from './review-media-items'

import { ReviewMediaLightboxView } from './review-media-lightbox-view'

export function ReviewMediaLightbox({
  items,
  onClose,
  onSelectId,
  selectedId,
}: {
  items: ProductReviewMediaItem[]
  onClose: () => void
  onSelectId: (id: string) => void
  selectedId: string | null
}) {
  const { market, t } = useMarket()
  const themeItems = getReviewMediaLightboxDisplays(items, market.locale)

  return (
    <ReviewMediaLightboxView
      model={{
        items: themeItems,
        labels: {
          anonymous: t('reviews.anonymous'),
          closePhotoGallery: t('reviews.closePhotoGallery'),
          customerPhoto: t('reviews.customerPhoto'),
          nextPhoto: t('reviews.nextPhoto'),
          openPhoto: t('reviews.openPhoto'),
          photoGallery: t('reviews.photoGallery'),
          previousPhoto: t('reviews.previousPhoto'),
          purchasedOptions: t('reviews.purchasedOptions'),
          verifiedBuyer: t('reviews.verifiedBuyer'),
        },
        selectedId,
      }}
      actions={{ close: onClose, selectId: onSelectId }}
    />
  )
}
