import type { KeyboardEvent } from 'react'
import { useLayoutEffect } from 'react'

import type { ProductImageZoomActions } from '../contracts/catalog'
import type { ProductGalleryImageDisplay } from './product-gallery-model'

export function useProductImageZoomController({
  actions,
  images,
  selectedIndex,
}: {
  actions: ProductImageZoomActions
  images: readonly ProductGalleryImageDisplay[]
  selectedIndex: number
}) {
  const image = images.at(selectedIndex)
  const hasMultipleImages = images.length > 1

  useLayoutEffect(() => {
    if (!image) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [image])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleImages) {
      return
    }

    if (event.key === 'ArrowLeft' && selectedIndex > 0) {
      event.preventDefault()
      actions.selectImage(selectedIndex - 1)
    }

    if (event.key === 'ArrowRight' && selectedIndex < images.length - 1) {
      event.preventDefault()
      actions.selectImage(selectedIndex + 1)
    }
  }

  return {
    handleKeyDown,
    hasMultipleImages,
    image,
  }
}
