import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CloseIcon } from '@/components/ui/close-icon'

import { DialogClose, DialogContent, DialogRoot } from '@/components/ui/dialog'

import { ProductImageZoomMobileView } from './product-image-zoom-mobile-view'
import { ProductGalleryProgressView } from './product-gallery-progress-view'
import type { ProductImageZoomModel } from './product-gallery-model'
import { useProductImageZoomController } from './use-product-image-zoom-controller'
import type { ProductImageZoomActions } from '../contracts/catalog'

export type { ProductImageZoomActions } from '../contracts/catalog'

export type ProductImageZoomCopy = {
  closeImagePreview: string
  imagePreview: string
  nextImage: string
  previousImage: string
}

type ProductImageZoomProps = {
  actions: ProductImageZoomActions
  model: ProductImageZoomModel
  copy: ProductImageZoomCopy
}

export function ProductImageZoomView({
  actions,
  model,
  copy,
}: ProductImageZoomProps) {
  const { images, selectedIndex } = model
  const { handleKeyDown, hasMultipleImages, image } =
    useProductImageZoomController({
      actions,
      images,
      selectedIndex,
    })

  if (!image) {
    return null
  }

  return (
    <DialogRoot
      disablePointerDismissal
      modal="trap-focus"
      onOpenChange={(open) => {
        if (!open) {
          actions.close()
        }
      }}
      open
    >
      <DialogContent
        backdropClassName="bg-background"
        className="inset-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden bg-background p-0 text-foreground shadow-none transition-none data-[ending-style]:scale-100 data-[ending-style]:opacity-100 data-[starting-style]:scale-100 data-[starting-style]:opacity-100 sm:p-0"
        closeLabel={copy.closeImagePreview}
        onKeyDown={handleKeyDown}
        showHeader={false}
        title={copy.imagePreview}
      >
        <DialogClose
          aria-label={copy.closeImagePreview}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 sm:right-6"
        >
          <CloseIcon />
        </DialogClose>

        <ProductImageZoomMobileView
          actions={{ selectImage: actions.selectImage }}
          images={images}
          previewLabel={copy.imagePreview}
          selectedIndex={selectedIndex}
        />

        <div className="hidden h-full w-full items-center justify-center px-24 py-14 lg:flex">
          <figure className="flex max-h-full min-h-0 max-w-full flex-col items-center gap-3">
            <div className="relative flex min-h-0 w-fit max-w-full items-center justify-center">
              {selectedIndex > 0 ? (
                <Button
                  variant="icon"
                  aria-label={copy.previousImage}
                  className="absolute top-1/2 right-full z-10 mr-8 -translate-y-1/2"
                  onClick={(event) => {
                    event.stopPropagation()
                    actions.selectImage(selectedIndex - 1)
                  }}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                </Button>
              ) : null}

              <img
                alt={image.alt}
                className="max-h-[calc(100dvh-7rem)] max-w-[min(68vw,48rem)] object-contain select-none"
                draggable={false}
                onClick={(event) => event.stopPropagation()}
                src={image.src}
                srcSet={image.srcSet}
              />

              {selectedIndex < images.length - 1 ? (
                <Button
                  variant="icon"
                  aria-label={copy.nextImage}
                  className="absolute top-1/2 left-full z-10 ml-8 -translate-y-1/2"
                  onClick={(event) => {
                    event.stopPropagation()
                    actions.selectImage(selectedIndex + 1)
                  }}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="h-6 w-6" />
                </Button>
              ) : null}
            </div>

            <div
              aria-hidden={hasMultipleImages ? undefined : 'true'}
              className="h-0.5 w-72 shrink-0"
            >
              <ProductGalleryProgressView
                ariaLabel={`${copy.imagePreview}: ${selectedIndex + 1} / ${images.length}`}
                className="w-full"
                imageCount={images.length}
                selectedIndex={selectedIndex}
              />
            </div>
          </figure>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
