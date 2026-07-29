import type {
  Category as SpreeCategory,
  Product as SpreeProduct,
} from '@spree/sdk'

import type {
  Product,
  ProductCategoryBreadcrumb,
  ProductSummary,
  ProductVariant,
} from '../model/product'
import {
  mapSpreeCompareAtPriceToMoney,
  mapSpreePriceToMoney,
} from '@/lib/money/map-spree-price'
import { isSyntheticCatalogRootCategory } from './category.mapper'
import {
  mapProductImage,
  mapProductImages,
  mergeProductImages,
} from './product-media.mapper'
import { mapProductOptions, mapProductVariants } from './product-option.mapper'
import { mapProductSpecifications } from './product-specification.mapper'

function mapProductCompareAtPrice(product: SpreeProduct) {
  return mapSpreeCompareAtPriceToMoney(product.price, product.original_price)
}

function mapProductCategoryBreadcrumb(
  category: SpreeCategory,
): ProductCategoryBreadcrumb {
  return {
    id: category.id,
    name: category.name,
    permalink: category.permalink,
  }
}

function mapProductCategoryBreadcrumbs(
  product: SpreeProduct,
): ProductCategoryBreadcrumb[] {
  const categories = product.categories ?? []

  if (categories.length === 0) {
    return []
  }

  const category =
    categories.find((candidate) => !candidate.is_root) ?? categories[0]

  return [
    ...(category.ancestors ?? [])
      .filter((ancestor) => !isSyntheticCatalogRootCategory(ancestor))
      .map(mapProductCategoryBreadcrumb),
    mapProductCategoryBreadcrumb(category),
  ]
}

export function mapSpreeProductToSummary(
  product: SpreeProduct,
): ProductSummary {
  const variants = mapProductVariants(product.variants)
  const displayVariant: ProductVariant | null =
    (product.default_variant
      ? mapProductVariants([product.default_variant]).at(0)
      : null) ??
    variants.find((variant) => variant.id === product.default_variant_id) ??
    variants.at(0) ??
    null
  return {
    defaultVariantId: product.default_variant_id,
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    price: displayVariant?.price ?? mapSpreePriceToMoney(product.price),
    compareAtPrice:
      displayVariant?.compareAtPrice ?? mapProductCompareAtPrice(product),
    image:
      displayVariant?.image ?? mapProductImage(product.primary_media, product),
    variants,
    variantsLoaded: product.variants !== undefined,
    inStock: displayVariant?.inStock ?? product.in_stock,
    backorderable: displayVariant?.backorderable ?? product.backorderable,
    purchasable: displayVariant?.purchasable ?? product.purchasable,
    preorder: displayVariant?.preorder ?? false,
  }
}

export function mapSpreeProductsToSummaries(
  products: SpreeProduct[],
): ProductSummary[] {
  return products.map(mapSpreeProductToSummary)
}

export function mapSpreeProductToProduct(product: SpreeProduct): Product {
  const variants = mapProductVariants(product.variants)
  const defaultVariant = product.default_variant
    ? mapProductVariants([product.default_variant])[0]
    : undefined
  const normalizedVariants =
    defaultVariant &&
    !variants.some((variant) => variant.id === defaultVariant.id)
      ? [defaultVariant, ...variants]
      : variants
  const images = mapProductImages(product)
  const variantImages = normalizedVariants.flatMap((variant) =>
    variant.image ? [variant.image] : [],
  )
  const allImages = mergeProductImages([...images, ...variantImages])

  return {
    categoryBreadcrumbs: mapProductCategoryBreadcrumbs(product),
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    descriptionHtml: product.description_html ?? '',
    metaDescription: product.meta_description ?? product.description ?? '',
    metaTitle: product.meta_title,
    price: defaultVariant?.price ?? mapSpreePriceToMoney(product.price),
    compareAtPrice:
      defaultVariant?.compareAtPrice ?? mapProductCompareAtPrice(product),
    defaultVariantId: product.default_variant_id,
    images: allImages,
    inStock: product.in_stock,
    backorderable: product.backorderable,
    preorder: product.preorder,
    preorderShipsAt: product.preorder_ships_at,
    options: mapProductOptions(product, normalizedVariants),
    purchasable: product.purchasable,
    specifications: mapProductSpecifications(product),
    variants: normalizedVariants,
    variantCount: product.variant_count,
  }
}
