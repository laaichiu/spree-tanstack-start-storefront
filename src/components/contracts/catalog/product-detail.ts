import type { ReactNode } from 'react'
import type { MoneyDisplay } from '@/components/shared/money-display'
import type { ProductRatingAnchorDisplay } from '@/components/reviews/product-rating-anchor-model'

export type ProductGalleryActions = {
  openZoom: () => void
  selectImage: (index: number) => void
}

export type ProductImageZoomActions = {
  close: () => void
  selectImage: (index: number) => void
}

type ProductDetailBrandDisplay = {
  name: string
  slug: string
}

export type ProductDetailBrandLink = (
  brand: ProductDetailBrandDisplay,
  props: { children: ReactNode; className: string },
) => ReactNode

export type ProductDetailHeadingModel = {
  brand: ProductDetailBrandDisplay | null
  breadcrumbLabel: string
  price: MoneyDisplay
  productName: string
  reviewAnchor: ProductRatingAnchorDisplay | null
}

export type ProductDisclosureSection = 'description' | 'details'

type ProductDisclosureSpecification = {
  label: string
  value: string
}

export type ProductDisclosuresCopy = {
  description: string
  details: string
  itemNumberLabel: string
  noAdditionalProperties: string
  productUnavailableDescription: string
}

export type ProductDisclosuresModel = {
  activeSku: string | null
  copy: ProductDisclosuresCopy
  description: string
  descriptionHtml: string
  specifications: readonly ProductDisclosureSpecification[]
}

export type ProductDetailState = {
  expandedDisclosureSection: ProductDisclosureSection | null
  isZoomed: boolean
  selectedImageIndex: number
}

export type ProductDetailActions = {
  closeZoom: () => void
  openZoom: () => void
  resetGallery: () => void
  selectImage: (index: number) => void
  toggleDisclosure: (section: ProductDisclosureSection) => void
}

export type ProductDetailController = {
  actions: ProductDetailActions
  state: ProductDetailState
}
