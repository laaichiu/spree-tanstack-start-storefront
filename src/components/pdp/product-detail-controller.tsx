import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMarket } from '@/components/layout/market-provider'
import { getVisibleProductImagesForVariant } from '@/lib/catalog/contracts'
import type {
  ProductImage,
  ProductPageModel as CoreProductPageModel,
} from '@/lib/catalog/contracts'

import { useProductPurchase } from '@/lib/catalog/client/use-product-purchase'
import type { ProductPurchaseController } from '@/lib/catalog/client/use-product-purchase'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import type { ProductDisclosureSection } from '@/components/contracts/catalog'
import { getProductGalleryImagesKey } from './product-gallery-model'
import { useProductDetail } from './use-product-detail'

type ProductPageModel = CoreProductPageModel<ProductReviewsFeatureState>

export type { ProductDisclosureSection }

export type ProductGalleryController = {
  closeZoom: () => void
  images: ProductImage[]
  isZoomed: boolean
  openZoom: () => void
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
  const { market } = useMarket()
  const { product } = page
  const purchase = useProductPurchase(product, { market })
  const visibleImages = useMemo(
    () =>
      getVisibleProductImagesForVariant(
        product.images,
        purchase.selectedVariant?.id ?? null,
      ),
    [product.images, purchase.selectedVariant?.id],
  )
  const detailController = useProductDetail({
    galleryImageCount: visibleImages.length,
    galleryImagesKey: getProductGalleryImagesKey(visibleImages),
    resetDisclosureKey: product.id,
    resetGalleryKey: purchase.selectedVariant?.id ?? null,
  })
  const selectedIndex = detailController.state.selectedImageIndex

  function selectOption(optionId: string, valueId: string) {
    detailController.actions.resetGallery()
    purchase.selectOption(optionId, valueId)
  }

  return children({
    disclosures: {
      expandedSection: detailController.state.expandedDisclosureSection,
      toggle: detailController.actions.toggleDisclosure,
    },
    gallery: {
      closeZoom: detailController.actions.closeZoom,
      images: visibleImages,
      isZoomed: detailController.state.isZoomed,
      openZoom: detailController.actions.openZoom,
      selectedIndex,
      selectImage: detailController.actions.selectImage,
    },
    page,
    purchase: {
      ...purchase,
      selectOption,
    },
  })
}
