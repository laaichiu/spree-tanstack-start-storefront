import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { ProductDisclosureSection } from '@/components/pdp/product-detail-disclosures'
import { useProductPurchase } from '@/components/pdp/use-product-purchase'
import type { ProductPurchaseController } from '@/components/pdp/use-product-purchase'
import type { ProductImage } from '@/lib/catalog/model/product'
import type { ProductPageModel } from '@/lib/catalog/model/product-page'
import { getVisibleProductImagesForVariant } from '@/lib/catalog/utils/product-media-selection'

export type ProductGalleryController = {
  closeZoom: () => void
  hasMultipleImages: boolean
  images: ProductImage[]
  isZoomed: boolean
  openZoom: () => void
  selectedImage: ProductImage | null
  selectedIndex: number
  selectImage: (index: number) => void
}

export type ProductDisclosureController = {
  expandedSection: ProductDisclosureSection | null
  toggle: (section: ProductDisclosureSection) => void
}

export type ProductDetailControllerValue = {
  disclosures: ProductDisclosureController
  gallery: ProductGalleryController
  page: ProductPageModel
  purchase: ProductPurchaseController
}

type ProductDetailControllerProps = {
  children: (controller: ProductDetailControllerValue) => ReactNode
  page: ProductPageModel
}

export function ProductDetailController({
  children,
  page,
}: ProductDetailControllerProps) {
  const { product } = page
  const purchase = useProductPurchase(product)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const [expandedSection, setExpandedSection] =
    useState<ProductDisclosureSection | null>('description')
  const visibleImages = useMemo(
    () =>
      getVisibleProductImagesForVariant(
        product.images,
        purchase.selectedVariant?.id ?? null,
      ),
    [product.images, purchase.selectedVariant?.id],
  )
  const selectedIndex =
    visibleImages.length > 0
      ? Math.min(selectedMediaIndex, visibleImages.length - 1)
      : 0
  const selectedImage =
    visibleImages.at(selectedIndex) ?? visibleImages.at(0) ?? null

  function selectOption(optionId: string, valueId: string) {
    setSelectedMediaIndex(0)
    purchase.selectOption(optionId, valueId)
  }

  function toggleDisclosure(section: ProductDisclosureSection) {
    setExpandedSection((currentSection) =>
      currentSection === section ? null : section,
    )
  }

  return children({
    disclosures: {
      expandedSection,
      toggle: toggleDisclosure,
    },
    gallery: {
      closeZoom: () => setIsImageZoomed(false),
      hasMultipleImages: visibleImages.length > 1,
      images: visibleImages,
      isZoomed: isImageZoomed,
      openZoom: () => setIsImageZoomed(true),
      selectedImage,
      selectedIndex,
      selectImage: setSelectedMediaIndex,
    },
    page,
    purchase: {
      ...purchase,
      selectOption,
    },
  })
}
