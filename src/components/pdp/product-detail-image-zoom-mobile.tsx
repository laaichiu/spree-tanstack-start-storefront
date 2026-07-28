import type { UIEvent } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'

import type { ProductImage } from '@/lib/catalog/model/product'

import { getMobileGalleryIndex } from './product-detail-mobile-gallery'
import { ProductDetailImageZoomProgress } from './product-detail-image-zoom-progress'

type ProductDetailImageZoomMobileProps = {
  images: ProductImage[]
  onSelectImage: (index: number) => void
  previewLabel: string
  selectedIndex: number
}

export function ProductDetailImageZoomMobile({
  images,
  onSelectImage,
  previewLabel,
  selectedIndex,
}: ProductDetailImageZoomMobileProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(selectedIndex)
  const hasAlignedRef = useRef(false)

  useLayoutEffect(() => {
    const scroller = scrollerRef.current

    if (
      !scroller ||
      (hasAlignedRef.current && activeIndexRef.current === selectedIndex)
    ) {
      return
    }

    hasAlignedRef.current = true
    activeIndexRef.current = selectedIndex
    scroller.scrollLeft = scroller.clientWidth * selectedIndex
  }, [selectedIndex])

  useEffect(() => {
    const scroller = scrollerRef.current

    if (!scroller || typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      scroller.scrollLeft = scroller.clientWidth * activeIndexRef.current
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
    <div className="relative h-full w-full lg:hidden">
      <div
        aria-label={previewLabel}
        aria-roledescription="carousel"
        className="scrollbar-none flex h-full w-full touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
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
            />
          </div>
        ))}
      </div>

      <ProductDetailImageZoomProgress
        className="absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 sm:right-8 sm:left-8"
        imageCount={images.length}
        previewLabel={previewLabel}
        selectedIndex={selectedIndex}
      />
    </div>
  )
}
