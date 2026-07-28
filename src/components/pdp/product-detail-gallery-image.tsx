import type { ProductImage } from '@/lib/catalog/model/product'
import { cn } from '@/lib/utils'

type ProductDetailGalleryImageButtonProps = {
  aspectClassName?: string
  image: ProductImage | null
  imageComingSoon?: string
  isCurrent?: boolean
  isPriority?: boolean
  label: string
  onZoom: () => void
  sizes: string
}

export function ProductDetailGalleryImageButton({
  aspectClassName = 'aspect-product',
  image,
  imageComingSoon = '',
  isCurrent,
  isPriority = true,
  label,
  onZoom,
  sizes,
}: ProductDetailGalleryImageButtonProps) {
  return (
    <button
      aria-current={isCurrent ? 'true' : undefined}
      aria-label={label}
      className="block w-full max-w-full cursor-zoom-in bg-muted text-left focus-visible:focus-ring disabled:cursor-default"
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
            className="h-full w-full object-cover object-center"
            fetchPriority={isPriority ? 'high' : 'auto'}
            loading={isPriority ? 'eager' : 'lazy'}
            sizes={sizes}
            src={image.src}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              {imageComingSoon}
            </p>
          </div>
        )}
      </div>
    </button>
  )
}
