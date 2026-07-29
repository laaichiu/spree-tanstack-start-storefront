import type { Money } from '@/lib/money/money'

export type ProductImage = {
  id: string
  src: string
  alt: string
  variantIds: string[]
}

export type ProductCategoryBreadcrumb = {
  id: string
  name: string
  permalink: string
}

export type ProductSpecification = {
  label: string
  value: string
}

export type ProductSummary = {
  defaultVariantId: string | null
  id: string
  slug: string
  name: string
  description: string
  price: Money | null
  compareAtPrice?: Money | null
  image: ProductImage | null
  /** Whether `variants` was included in the API projection. */
  variantsLoaded?: boolean
  variants: ProductVariant[]
  inStock: boolean
  backorderable?: boolean
  purchasable?: boolean
  preorder: boolean
}

export type ProductOptionValue = {
  id: string
  name: string
  label: string
  colorCode: string | null
  imageUrl: string | null
}

export type ProductOption = {
  id: string
  name: string
  label: string
  values: ProductOptionValue[]
}

export type ProductVariantOptionValue = ProductOptionValue & {
  optionTypeId: string
  optionTypeName: string
  optionTypeLabel: string
}

export type ProductVariant = {
  id: string
  sku: string | null
  price: Money | null
  compareAtPrice?: Money | null
  image?: ProductImage | null
  inStock: boolean
  backorderable?: boolean
  purchasable?: boolean
  preorder: boolean
  preorderShipsAt: string | null
  optionValues: ProductVariantOptionValue[]
}

export type Product = {
  categoryBreadcrumbs: ProductCategoryBreadcrumb[]
  id: string
  slug: string
  name: string
  description: string
  descriptionHtml: string
  metaDescription: string
  metaTitle: string | null
  price: Money | null
  compareAtPrice?: Money | null
  defaultVariantId: string | null
  images: ProductImage[]
  inStock: boolean
  backorderable?: boolean
  preorder: boolean
  preorderShipsAt: string | null
  options: ProductOption[]
  purchasable: boolean
  specifications: ProductSpecification[]
  variants: ProductVariant[]
  variantCount: number
}
