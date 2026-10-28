import { useMarket } from '@/components/layout/market-provider'
import type { ProductGalleryController } from '@/components/pdp/product-detail-controller'
import {
  getProductGalleryModel,
  getProductImageZoomModel,
} from './product-gallery-model'
import { ProductGalleryView } from './product-gallery-view'
import { ProductImageZoomView } from './product-image-zoom-view'
import { ProductOfferBadgesView } from '@/components/catalog/product-offer-badges-view'

type ProductGallerySectionProps = {
  discountPercent: number | null
  gallery: ProductGalleryController
  isPreorder: boolean
  productName: string
}

export function ProductGallerySection({
  discountPercent,
  gallery,
  isPreorder,
  productName,
}: ProductGallerySectionProps) {
  const { t } = useMarket()
  const model = getProductGalleryModel({
    images: gallery.images,
    productName,
    selectedIndex: gallery.selectedIndex,
  })

  return (
    <>
      <ProductGalleryView
        actions={{
          openZoom: gallery.openZoom,
          selectImage: gallery.selectImage,
        }}
        copy={{
          galleryLabel: t('product.gallery'),
          imageComingSoon: t('product.imageComingSoon'),
        }}
        model={model}
        badgeOverlay={
          <ProductOfferBadgesView
            preorderLabel={isPreorder ? t('product.preorder') : null}
            saleLabel={
              discountPercent
                ? t('product.discount').replace(
                    '{percent}',
                    String(discountPercent),
                  )
                : null
            }
          />
        }
      />

      {gallery.isZoomed && model.selectedImage ? (
        <ProductImageZoomView
          actions={{
            close: gallery.closeZoom,
            selectImage: gallery.selectImage,
          }}
          model={getProductImageZoomModel(model)}
          copy={{
            closeImagePreview: t('product.closeImagePreview'),
            imagePreview: t('product.imagePreview'),
            nextImage: t('product.nextImage'),
            previousImage: t('product.previousImage'),
          }}
        />
      ) : null}
    </>
  )
}
