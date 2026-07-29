import type {
  Category as SpreeCategory,
  Product as SpreeProduct,
} from '@spree/sdk'

import type {
  Product,
  ProductCategoryBreadcrumb,
  ProductSummary,
} from '../model/product'
import { mapSpreePriceToMoney } from '@/lib/money/map-spree-price'
import { isSyntheticCatalogRootCategory } from './category.mapper'
import { mapProductImage, mapProductImages } from './product-media.mapper'
import { mapProductOptions, mapProductVariants } from './product-option.mapper'
import { mapProductSpecifications } from './product-specification.mapper'

function mapProductCompareAtPrice(product: SpreeProduct) {
  return product.original_price
    ? mapSpreePriceToMoney(product.original_price)
    : undefined
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
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    price: mapSpreePriceToMoney(product.price),
    compareAtPrice: mapProductCompareAtPrice(product),
    image: mapProductImage(product.primary_media, product),
    inStock: product.purchasable && (product.in_stock || product.preorder),
    preorder: product.preorder,
  }
}

export function mapSpreeProductsToSummaries(
  products: SpreeProduct[],
): ProductSummary[] {
  return products.map(mapSpreeProductToSummary)
}

export function mapSpreeProductToProduct(product: SpreeProduct): Product {
  const variants = mapProductVariants(product.variants)

  return {
    categoryBreadcrumbs: mapProductCategoryBreadcrumbs(product),
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    descriptionHtml: product.description_html ?? '',
    metaDescription: product.meta_description ?? product.description ?? '',
    metaTitle: product.meta_title,
    price: mapSpreePriceToMoney(product.price),
    compareAtPrice: mapProductCompareAtPrice(product),
    defaultVariantId: product.default_variant_id,
    images: mapProductImages(product),
    inStock: product.purchasable && (product.in_stock || product.preorder),
    preorder: product.preorder,
    preorderShipsAt: product.preorder_ships_at,
    options: mapProductOptions(product, variants),
    purchasable: product.purchasable,
    specifications: mapProductSpecifications(product),
    variants,
    variantCount: product.variant_count,
  }
}
