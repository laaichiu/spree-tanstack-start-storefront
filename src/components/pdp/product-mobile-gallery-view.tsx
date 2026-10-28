import type { ReactNode } from 'react'

import { ProductGalleryImageButtonView } from './product-gallery-image-button-view'
import { getProductGalleryImagesKey } from './product-gallery-model'
import type { ProductGalleryImageDisplay } from './product-gallery-model'
import { ProductGalleryProgressView } from './product-gallery-progress-view'
import { useProductMobileGalleryScrollController } from './use-product-mobile-gallery-scroll-controller'

type ProductMobileGalleryProps = {
  actions: {
    selectImage: (index: number) => void
    zoom: () => void
  }
  badgeOverlay?: ReactNode
  galleryLabel: string
  images: readonly ProductGalleryImageDisplay[]
  productName: string
  safeSelectedMediaIndex: number
}

type ProductMobileGalleryProgressProps = {
  galleryLabel: string
  imageCount: number
  productName: string
  selectedIndex: number
}

export function ProductMobileGalleryView({
  actions,
  badgeOverlay,
  galleryLabel,
  images,
  productName,
  safeSelectedMediaIndex,
}: ProductMobileGalleryProps) {
  const { handleScroll, scrollerRef } = useProductMobileGalleryScrollController(
    {
      imageCount: images.length,
      imagesKey: getProductGalleryImagesKey(images),
      onSelectImage: actions.selectImage,
      selectedIndex: safeSelectedMediaIndex,
    },
  )

  return (
    <div className="min-w-0">
      <div
        aria-label={`${productName}: ${galleryLabel}`}
        aria-roledescription="carousel"
        className="flex min-w-0 max-w-full touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        ref={scrollerRef}
        role="group"
      >
        {images.map((image, index) => (
          <div
            aria-label={`${index + 1} / ${images.length}`}
            aria-roledescription="slide"
            className="w-full shrink-0 snap-center snap-always"
            key={image.id}
            role="group"
          >
            <ProductGalleryImageButtonView
              aspectClassName="aspect-product sm:aspect-[5/6]"
              image={image}
              isCurrent={index === safeSelectedMediaIndex}
              isPriority={index === 0}
              label={`${productName}: ${galleryLabel} ${index + 1} / ${images.length}`}
              onZoom={() => {
                actions.selectImage(index)
                actions.zoom()
              }}
              sizes="100vw"
              overlay={
                index === 0 && badgeOverlay ? (
                  <div className="absolute top-2 left-2 z-10">
                    {badgeOverlay}
                  </div>
                ) : null
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductMobileGalleryProgressView({
  galleryLabel,
  imageCount,
  productName,
  selectedIndex,
}: ProductMobileGalleryProgressProps) {
  return (
    <div
      aria-hidden={imageCount > 1 ? undefined : 'true'}
      className="mt-3 h-0.5 w-full"
    >
      <ProductGalleryProgressView
        ariaLabel={`${productName}: ${galleryLabel} ${selectedIndex + 1} / ${imageCount}`}
        className="h-full w-full"
        imageCount={imageCount}
        selectedIndex={selectedIndex}
      />
    </div>
  )
}
