import type { Money } from '@/lib/core/money'

export type ProductImage = {
  id: string
  src: string
  srcSet?: string
  alt: string
  variantIds: string[]
}

export type ProductCategoryBreadcrumb = {
  id: string
  name: string
  permalink: string
}

/**
 * The public seller projection used when a multi-seller product is presented
 * as a consumer-facing brand. First-party products have no brand.
 */
export type ProductBrandReference = {
  id: string
  name: string
  slug: string
}

export type ProductSpecification = {
  label: string
  value: string
}

/**
 * Stable catalog identity used by page composition and product links.
 * Presentation and commerce fields stay on ProductSummary/Product.
 */
export type CatalogProductReference = {
  id: string
  name: string
  slug: string
}

export type ProductSummary = {
  /** Public seller projection presented as the product's brand, when present. */
  brand?: ProductBrandReference | null
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
  brand?: ProductBrandReference | null
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
