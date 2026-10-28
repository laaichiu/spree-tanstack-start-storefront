import type { ReactNode } from 'react'

import {
  ProductMobileGalleryView,
  ProductMobileGalleryProgressView,
} from './product-mobile-gallery-view'
import { ProductGalleryImageButtonView } from './product-gallery-image-button-view'
import type { ProductGalleryModel } from './product-gallery-model'
import type { ProductGalleryActions } from '../contracts/catalog'

export type { ProductGalleryActions } from '../contracts/catalog'

export type ProductGalleryCopy = {
  galleryLabel: string
  imageComingSoon: string
}

type ProductGalleryProps = {
  actions: ProductGalleryActions
  badgeOverlay?: ReactNode
  copy: ProductGalleryCopy
  model: ProductGalleryModel
}

export function ProductGalleryView({
  actions,
  badgeOverlay,
  copy,
  model,
}: ProductGalleryProps) {
  const { galleryLabel, imageComingSoon } = copy
  const badgeOverlayContent = badgeOverlay ? (
    <div className="absolute top-2 left-2 z-10">{badgeOverlay}</div>
  ) : null

  return (
    <section aria-label={galleryLabel} className="min-w-0">
      <div className="min-w-0 lg:hidden">
        {model.hasMultipleImages ? (
          <ProductMobileGalleryView
            actions={{
              selectImage: actions.selectImage,
              zoom: actions.openZoom,
            }}
            galleryLabel={galleryLabel}
            images={model.images}
            productName={model.productName}
            badgeOverlay={badgeOverlay}
            safeSelectedMediaIndex={model.safeSelectedMediaIndex}
          />
        ) : (
          <ProductGalleryImageButtonView
            aspectClassName="aspect-product sm:aspect-[5/6]"
            image={model.selectedImage}
            imageComingSoon={imageComingSoon}
            label={galleryLabel}
            onZoom={actions.openZoom}
            overlay={badgeOverlayContent}
            sizes="100vw"
          />
        )}

        <ProductMobileGalleryProgressView
          galleryLabel={galleryLabel}
          imageCount={model.images.length}
          productName={model.productName}
          selectedIndex={model.safeSelectedMediaIndex}
        />
      </div>

      <div className="hidden lg:block">
        {model.hasMultipleImages ? (
          <div className="grid grid-cols-2 gap-1.5 xl:gap-2">
            {model.images.map((image, index) => (
              <button
                aria-current={
                  index === model.safeSelectedMediaIndex ? 'true' : undefined
                }
                aria-label={`${model.productName}: ${galleryLabel} ${index + 1}`}
                className="relative cursor-zoom-in overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                key={image.id}
                onClick={() => {
                  actions.selectImage(index)
                  actions.openZoom()
                }}
                type="button"
              >
                <div className="aspect-product">
                  <img
                    alt={image.alt}
                    className="h-full w-full object-cover object-center"
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    src={image.src}
                    srcSet={image.srcSet}
                  />
                </div>
                {index === 0 ? badgeOverlayContent : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 xl:gap-2">
            <ProductGalleryImageButtonView
              image={model.selectedImage}
              imageComingSoon={imageComingSoon}
              label={galleryLabel}
              onZoom={actions.openZoom}
              overlay={badgeOverlayContent}
              sizes="(min-width: 1024px) 34vw, 100vw"
            />
            <div aria-hidden="true" className="aspect-product bg-transparent" />
          </div>
        )}
      </div>
    </section>
  )
}
