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
  id: string
  slug: string
  name: string
  description: string
  price: Money
  compareAtPrice?: Money
  image: ProductImage | null
  inStock: boolean
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
  price: Money
  compareAtPrice?: Money
  inStock: boolean
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
  price: Money
  compareAtPrice?: Money
  defaultVariantId: string | null
  images: ProductImage[]
  inStock: boolean
  options: ProductOption[]
  purchasable: boolean
  specifications: ProductSpecification[]
  variants: ProductVariant[]
  variantCount: number
}
