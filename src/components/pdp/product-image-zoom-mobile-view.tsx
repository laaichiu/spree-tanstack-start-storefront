import { getProductGalleryImagesKey } from './product-gallery-model'
import type { ProductGalleryImageDisplay } from './product-gallery-model'
import { ProductGalleryProgressView } from './product-gallery-progress-view'
import { useProductMobileGalleryScrollController } from './use-product-mobile-gallery-scroll-controller'

type ProductImageZoomMobileProps = {
  actions: {
    selectImage: (index: number) => void
  }
  images: readonly ProductGalleryImageDisplay[]
  previewLabel: string
  selectedIndex: number
}

export function ProductImageZoomMobileView({
  actions,
  images,
  previewLabel,
  selectedIndex,
}: ProductImageZoomMobileProps) {
  const { handleScroll, scrollerRef } = useProductMobileGalleryScrollController(
    {
      imageCount: images.length,
      imagesKey: getProductGalleryImagesKey(images),
      onSelectImage: actions.selectImage,
      selectedIndex,
    },
  )

  return (
    <div className="relative h-full w-full lg:hidden">
      <div
        aria-label={previewLabel}
        aria-roledescription="carousel"
        className="flex h-full w-full touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        ref={scrollerRef}
        role="region"
      >
        {images.map((image, index) => (
          <div
            aria-current={index === selectedIndex ? 'true' : undefined}
            aria-label={`${image.alt} ${index + 1} / ${images.length}`}
            aria-roledescription="slide"
            className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(3.5rem,calc(env(safe-area-inset-bottom)+2.5rem))] sm:px-8"
            key={image.id}
            role="group"
          >
            <img
              alt={image.alt}
              className="max-h-full max-w-full object-contain"
              draggable={false}
              fetchPriority={index === selectedIndex ? 'high' : 'auto'}
              loading={index === selectedIndex ? 'eager' : 'lazy'}
              src={image.src}
              srcSet={image.srcSet}
            />
          </div>
        ))}
      </div>

      <ProductGalleryProgressView
        ariaLabel={`${previewLabel}: ${selectedIndex + 1} / ${images.length}`}
        className="absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 sm:right-8 sm:left-8"
        imageCount={images.length}
        selectedIndex={selectedIndex}
      />
    </div>
  )
}
