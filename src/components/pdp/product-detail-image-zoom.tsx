import type { KeyboardEvent } from 'react'
import { useLayoutEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { DialogClose, DialogContent, DialogRoot } from '@/components/ui/dialog'
import type { ProductImage } from '@/lib/catalog/model/product'
import type { MessageKey } from '@/lib/i18n/messages'

import { ProductDetailImageZoomMobile } from './product-detail-image-zoom-mobile'
import { ProductDetailImageZoomProgress } from './product-detail-image-zoom-progress'

type ProductDetailImageZoomProps = {
  images: ProductImage[]
  onClose: () => void
  onSelectImage: (index: number) => void
  selectedIndex: number
  t: (key: MessageKey) => string
}

export function ProductDetailImageZoom({
  images,
  onClose,
  onSelectImage,
  selectedIndex,
  t,
}: ProductDetailImageZoomProps) {
  const image = images.at(selectedIndex)
  const hasMultipleImages = images.length > 1
  const shouldLockScroll = image !== undefined

  useLayoutEffect(() => {
    if (!shouldLockScroll) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [shouldLockScroll])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleImages) {
      return
    }

    if (event.key === 'ArrowLeft' && selectedIndex > 0) {
      event.preventDefault()
      onSelectImage(selectedIndex - 1)
    }

    if (event.key === 'ArrowRight' && selectedIndex < images.length - 1) {
      event.preventDefault()
      onSelectImage(selectedIndex + 1)
    }
  }

  if (!image) {
    return null
  }

  return (
    <DialogRoot
      disablePointerDismissal
      modal="trap-focus"
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open
    >
      <DialogContent
        backdropClassName="bg-background"
        className="inset-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden bg-background p-0 text-foreground shadow-none transition-none data-[ending-style]:scale-100 data-[ending-style]:opacity-100 data-[starting-style]:scale-100 data-[starting-style]:opacity-100 sm:p-0"
        closeLabel={t('product.closeImagePreview')}
        onKeyDown={handleKeyDown}
        showHeader={false}
        title={t('product.imagePreview')}
      >
        <DialogClose
          aria-label={t('product.closeImagePreview')}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 inline-flex h-11 w-11 items-center justify-center sm:right-6"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </DialogClose>

        <ProductDetailImageZoomMobile
          images={images}
          onSelectImage={onSelectImage}
          previewLabel={t('product.imagePreview')}
          selectedIndex={selectedIndex}
        />

        <div className="hidden h-full w-full items-center justify-center px-24 py-14 lg:flex">
          <figure className="flex max-h-full min-h-0 max-w-full flex-col items-center gap-3">
            <div className="relative flex min-h-0 w-fit max-w-full items-center justify-center">
              {selectedIndex > 0 ? (
                <button
                  aria-label={t('product.previousImage')}
                  className="absolute top-1/2 right-full z-10 mr-5 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:focus-ring"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectImage(selectedIndex - 1)
                  }}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                </button>
              ) : null}

              <img
                alt={image.alt}
                className="max-h-[calc(100dvh-7rem)] max-w-[min(68vw,48rem)] object-contain select-none"
                draggable={false}
                onClick={(event) => event.stopPropagation()}
                src={image.src}
              />

              {selectedIndex < images.length - 1 ? (
                <button
                  aria-label={t('product.nextImage')}
                  className="absolute top-1/2 left-full z-10 ml-5 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:focus-ring"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectImage(selectedIndex + 1)
                  }}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="h-6 w-6" />
                </button>
              ) : null}
            </div>

            <div
              aria-hidden={hasMultipleImages ? undefined : 'true'}
              className="h-0.5 w-72 shrink-0"
            >
              <ProductDetailImageZoomProgress
                className="w-full"
                imageCount={images.length}
                previewLabel={t('product.imagePreview')}
                selectedIndex={selectedIndex}
              />
            </div>
          </figure>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
