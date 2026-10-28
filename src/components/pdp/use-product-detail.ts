import { useCallback, useEffect, useState } from 'react'

import type {
  ProductDetailActions,
  ProductDetailController,
  ProductDetailState,
  ProductDisclosureSection,
} from '../contracts/catalog'

export type {
  ProductDetailActions,
  ProductDetailController,
  ProductDetailState,
  ProductDisclosureSection,
} from '../contracts/catalog'

export function useProductDetail({
  galleryImageCount,
  galleryImagesKey,
  resetDisclosureKey,
  resetGalleryKey,
}: {
  galleryImageCount: number
  galleryImagesKey: string
  resetDisclosureKey: string | null
  resetGalleryKey: string | null
}): ProductDetailController {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [expandedDisclosureSection, setExpandedDisclosureSection] =
    useState<ProductDisclosureSection | null>('description')

  const resetGallery = useCallback(() => {
    setSelectedImageIndex(0)
    setIsZoomed(false)
  }, [])

  useEffect(() => {
    resetGallery()
  }, [galleryImagesKey, resetGallery, resetGalleryKey])

  useEffect(() => {
    setSelectedImageIndex((currentIndex) =>
      galleryImageCount > 0 ? Math.min(currentIndex, galleryImageCount - 1) : 0,
    )
    if (galleryImageCount === 0) {
      setIsZoomed(false)
    }
  }, [galleryImageCount])

  useEffect(() => {
    setExpandedDisclosureSection('description')
  }, [resetDisclosureKey])

  const selectImage = useCallback((index: number) => {
    setSelectedImageIndex(Math.max(0, index))
  }, [])

  const toggleDisclosure = useCallback((section: ProductDisclosureSection) => {
    setExpandedDisclosureSection((currentSection) =>
      currentSection === section ? null : section,
    )
  }, [])

  const safeSelectedImageIndex =
    galleryImageCount > 0
      ? Math.min(selectedImageIndex, galleryImageCount - 1)
      : 0

  const state: ProductDetailState = {
    expandedDisclosureSection,
    isZoomed,
    selectedImageIndex: safeSelectedImageIndex,
  }
  const actions: ProductDetailActions = {
    closeZoom: () => setIsZoomed(false),
    openZoom: () => setIsZoomed(true),
    resetGallery,
    selectImage,
    toggleDisclosure,
  }

  return { actions, state }
}
