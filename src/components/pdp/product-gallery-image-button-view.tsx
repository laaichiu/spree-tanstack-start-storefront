import type { ReactNode } from 'react'

import { cn } from '@/components/ui/utils'

import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import type { ProductGalleryImageDisplay } from './product-gallery-model'

export function ProductGalleryImageButtonView({
  aspectClassName = 'aspect-product',
  image,
  imageComingSoon = '',
  isCurrent,
  isPriority = true,
  label,
  onZoom,
  overlay,
  sizes,
}: {
  aspectClassName?: string
  image: ProductGalleryImageDisplay | null
  imageComingSoon?: string
  isCurrent?: boolean
  isPriority?: boolean
  label: string
  onZoom: () => void
  overlay?: ReactNode
  sizes: string
}) {
  return (
    <button
      aria-current={isCurrent ? 'true' : undefined}
      aria-label={label}
      className="relative block w-full max-w-full cursor-zoom-in bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default"
      disabled={!image}
      onClick={() => {
        if (image) {
          onZoom()
        }
      }}
      type="button"
    >
      <div className={cn(aspectClassName, 'overflow-hidden')}>
        {image ? (
          <img
            alt={image.alt}
            className="h-full w-full object-cover object-center max-lg:landscape:object-contain"
            fetchPriority={isPriority ? 'high' : 'auto'}
            loading={isPriority ? 'eager' : 'lazy'}
            sizes={sizes}
            src={image.src}
            srcSet={image.srcSet}
          />
        ) : (
          <ProductImageFallbackView label={imageComingSoon} />
        )}
      </div>
      {overlay}
    </button>
  )
}
