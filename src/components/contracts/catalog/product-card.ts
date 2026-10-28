import type { ReactNode } from 'react'
import type { ProductImage } from '@/lib/catalog/contracts'
import type { MoneyDisplay } from '@/components/shared/money-display'

export type ProductCardImage = Pick<ProductImage, 'alt' | 'src' | 'srcSet'>

export type CatalogProductColorVariant = {
  optionValue: {
    colorCode: string | null
    id: string
    imageUrl: string | null
    label: string
  }
  variant: {
    id: string
  }
}

export type CatalogProductCardModel = {
  activeVariantId: string | null
  attribution: string | null
  colorVariants: readonly CatalogProductColorVariant[]
  displayImage: ProductCardImage | null
  imageFallbackLabel: string
  name: string
  outOfStockLabel: string | null
  preorderLabel: string | null
  price: MoneyDisplay
  saleLabel: string | null
}

export type CatalogProductCardCapabilities = {
  renderProductLink: (content: ReactNode, className?: string) => ReactNode
}

export type ProductCardSlots = {
  badges?: ReactNode
  swatches?: ReactNode
}

export type CatalogProductCardViewProps = {
  capabilities: CatalogProductCardCapabilities
  model: CatalogProductCardModel
  onVariantChange: (variantId: string) => void
  priority?: boolean
  variant?: 'default' | 'listing'
}
