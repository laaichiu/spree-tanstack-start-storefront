import type { UIEvent } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'

import type { ProductImage } from '@/lib/catalog/model/product'

import { ProductDetailGalleryImageButton } from './product-detail-gallery-image'

type ProductDetailMobileGalleryProps = {
  galleryLabel: string
  images: ProductImage[]
  onSelectImage: (index: number) => void
  onZoom: () => void
  productName: string
  safeSelectedMediaIndex: number
}

type ProductDetailMobileGalleryProgressProps = {
  galleryLabel: string
  imageCount: number
  productName: string
  selectedIndex: number
}

export function ProductDetailMobileGallery({
  galleryLabel,
  images,
  onSelectImage,
  onZoom,
  productName,
  safeSelectedMediaIndex,
}: ProductDetailMobileGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(safeSelectedMediaIndex)

  useLayoutEffect(() => {
    if (activeIndexRef.current === safeSelectedMediaIndex) {
      return
    }

    const scroller = scrollerRef.current

    if (!scroller) {
      return
    }

    activeIndexRef.current = safeSelectedMediaIndex
    scroller.scrollTo({
      behavior: 'auto',
      left: scroller.clientWidth * safeSelectedMediaIndex,
    })
  }, [safeSelectedMediaIndex])

  useEffect(() => {
    const scroller = scrollerRef.current

    if (!scroller || typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      scroller.scrollTo({
        behavior: 'auto',
        left: scroller.clientWidth * activeIndexRef.current,
      })
    })

    resizeObserver.observe(scroller)

    return () => resizeObserver.disconnect()
  }, [])

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const nextIndex = getMobileGalleryIndex(
      event.currentTarget.scrollLeft,
      event.currentTarget.clientWidth,
      images.length,
    )

    if (nextIndex === activeIndexRef.current) {
      return
    }

    activeIndexRef.current = nextIndex
    onSelectImage(nextIndex)
  }

  return (
    <div className="min-w-0">
      <div
        aria-label={`${productName}: ${galleryLabel}`}
        aria-roledescription="carousel"
        className="scrollbar-none flex min-w-0 max-w-full touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
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
            <ProductDetailGalleryImageButton
              aspectClassName="aspect-product sm:aspect-[5/6]"
              image={image}
              isCurrent={index === safeSelectedMediaIndex}
              isPriority={index === 0}
              label={`${productName}: ${galleryLabel} ${index + 1} / ${images.length}`}
              onZoom={() => {
                onSelectImage(index)
                onZoom()
              }}
              sizes="100vw"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductDetailMobileGalleryProgress({
  galleryLabel,
  imageCount,
  productName,
  selectedIndex,
}: ProductDetailMobileGalleryProgressProps) {
  const hasMultipleImages = imageCount > 1

  return (
    <div
      aria-hidden={hasMultipleImages ? undefined : 'true'}
      className="mt-3 h-0.5 w-full"
    >
      {hasMultipleImages ? (
        <div
          aria-label={`${productName}: ${galleryLabel} ${selectedIndex + 1} / ${imageCount}`}
          aria-valuemax={imageCount}
          aria-valuemin={1}
          aria-valuenow={selectedIndex + 1}
          className="relative h-full w-full bg-border"
          role="progressbar"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{
              transform: `translateX(${selectedIndex * 100}%)`,
              width: `${100 / imageCount}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export function getMobileGalleryIndex(
  scrollLeft: number,
  viewportWidth: number,
  imageCount: number,
) {
  if (viewportWidth <= 0 || imageCount <= 1) {
    return 0
  }

  return Math.max(
    0,
    Math.min(imageCount - 1, Math.round(scrollLeft / viewportWidth)),
  )
}
