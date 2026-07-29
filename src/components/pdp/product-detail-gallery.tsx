import type { ProductImage } from '@/lib/catalog/model/product'
import type { MessageKey } from '@/lib/i18n/messages'
import type { Money } from '@/lib/money/money'
import { ProductOfferBadges } from '@/components/shared/product-offer-badges'

import { ProductDetailGalleryImageButton } from './product-detail-gallery-image'
import {
  ProductDetailMobileGallery,
  ProductDetailMobileGalleryProgress,
} from './product-detail-mobile-gallery'

type ProductDetailGalleryProps = {
  hasMultipleImages: boolean
  images: ProductImage[]
  isPreorder?: boolean
  onSelectImage: (index: number) => void
  onZoom: () => void
  productName: string
  compareAtPrice?: Money | null
  discountPercent?: number | null
  price?: Money | null
  safeSelectedMediaIndex: number
  selectedImage: ProductImage | null
  t: (key: MessageKey) => string
}

export function ProductDetailGallery({
  hasMultipleImages,
  images,
  isPreorder = false,
  onSelectImage,
  onZoom,
  productName,
  compareAtPrice,
  discountPercent,
  price,
  safeSelectedMediaIndex,
  selectedImage,
  t,
}: ProductDetailGalleryProps) {
  const galleryLabel = t('product.gallery')
  function renderBadgeOverlay() {
    return (
      <ProductOfferBadges
        className="absolute top-2 left-2 z-10"
        compareAtPrice={compareAtPrice}
        discountPercent={discountPercent}
        isPreorder={isPreorder}
        price={price}
        t={t}
      />
    )
  }

  return (
    <section aria-label={galleryLabel} className="min-w-0">
      <div className="min-w-0 lg:hidden">
        {hasMultipleImages ? (
          <ProductDetailMobileGallery
            galleryLabel={galleryLabel}
            images={images}
            onSelectImage={onSelectImage}
            onZoom={onZoom}
            productName={productName}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            isPreorder={isPreorder}
            price={price}
            t={t}
            safeSelectedMediaIndex={safeSelectedMediaIndex}
          />
        ) : (
          <ProductDetailGalleryImageButton
            aspectClassName="aspect-product sm:aspect-[5/6]"
            image={selectedImage}
            imageComingSoon={t('product.imageComingSoon')}
            label={galleryLabel}
            onZoom={onZoom}
            overlay={renderBadgeOverlay()}
            sizes="100vw"
          />
        )}

        <ProductDetailMobileGalleryProgress
          galleryLabel={galleryLabel}
          imageCount={images.length}
          productName={productName}
          selectedIndex={safeSelectedMediaIndex}
        />
      </div>

      <div className="hidden lg:block">
        {hasMultipleImages ? (
          <div className="grid grid-cols-2 gap-1.5 xl:gap-2">
            {images.map((image, index) => (
              <button
                aria-current={
                  index === safeSelectedMediaIndex ? 'true' : undefined
                }
                aria-label={`${productName}: ${galleryLabel} ${index + 1}`}
                className="relative cursor-zoom-in overflow-hidden bg-muted text-left focus-visible:focus-ring"
                key={image.id}
                onClick={() => {
                  onSelectImage(index)
                  onZoom()
                }}
                type="button"
              >
                <div className="aspect-product">
                  <img
                    alt={image.alt}
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    src={image.src}
                  />
                </div>
                {index === 0 ? renderBadgeOverlay() : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 xl:gap-2">
            <ProductDetailGalleryImageButton
              image={selectedImage}
              imageComingSoon={t('product.imageComingSoon')}
              label={galleryLabel}
              onZoom={onZoom}
              overlay={renderBadgeOverlay()}
              sizes="(min-width: 1024px) 34vw, 100vw"
            />
            <div aria-hidden="true" className="aspect-product bg-transparent" />
          </div>
        )}
      </div>
    </section>
  )
}
