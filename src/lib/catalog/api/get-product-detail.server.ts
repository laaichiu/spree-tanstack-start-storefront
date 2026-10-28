import '@tanstack/react-start/server-only'

import type {
  Category as SpreeCategory,
  Client as SpreeClient,
  Product as SpreeProduct,
} from '@spree/sdk'

import type { ResolvedMarket } from '@/lib/core/market'
import { reportError } from '@/lib/observability/report-error'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeProductToProduct } from '../mappers/product.mapper'
import { getPreferredProductBreadcrumbCategory } from '../mappers/product-category-breadcrumb'
import { assertCatalogProductResponse } from '../mappers/product-response'
import {
  assertCatalogCategoryResourceMatchesRequestedId,
  assertCatalogCategoryTreeResourceIsCategory,
  assertCatalogProductNestedCategoriesAreCategories,
  assertCatalogProductNestedMediaBelongToProduct,
  assertCatalogProductNestedVariantsBelongToProduct,
  assertCatalogProductResourceIsProduct,
  assertCatalogProductResourceMatchesRequestedId,
} from '../utils/catalog-resource-identity'

function categoryHasBreadcrumbAncestors(category: SpreeCategory) {
  return Array.isArray(category.ancestors)
}

async function hydrateProductBreadcrumbCategory({
  client,
  product,
}: {
  client: SpreeClient
  product: SpreeProduct
}): Promise<SpreeProduct> {
  const category = getPreferredProductBreadcrumbCategory(
    product.categories ?? [],
  )

  if (!category || categoryHasBreadcrumbAncestors(category)) {
    return product
  }

  try {
    const expandedCategory = await client.categories.get(category.permalink, {
      expand: ['ancestors'],
    })
    assertCatalogCategoryTreeResourceIsCategory(expandedCategory)
    assertCatalogCategoryResourceMatchesRequestedId(
      expandedCategory,
      category.id,
    )
    const otherCategories = (product.categories ?? []).filter(
      (candidate) => candidate.id !== expandedCategory.id,
    )

    return {
      ...product,
      categories: [expandedCategory, ...otherCategories],
    }
  } catch (error) {
    reportError({
      context: 'products.detail.categoryBreadcrumb',
      error,
    })

    return product
  }
}

export async function getProductDetailForMarket({
  market,
  slug,
}: {
  market: ResolvedMarket
  slug: string
}) {
  const client = getServerSpreeClientForMarket(market)
  const product = await client.products.get(slug, {
    expand: [
      'primary_media',
      'media',
      'default_variant',
      'variants',
      'variants.media',
      'categories.ancestors',
      'custom_fields',
      'seller',
    ],
  })
  assertCatalogProductResourceIsProduct(product)
  assertCatalogProductNestedCategoriesAreCategories(product)
  assertCatalogProductNestedVariantsBelongToProduct(product)
  assertCatalogProductResourceMatchesRequestedId(product, slug)
  assertCatalogProductResponse(product)
  assertCatalogProductNestedMediaBelongToProduct(product)
  const productWithBreadcrumbCategory = await hydrateProductBreadcrumbCategory({
    client,
    product,
  })

  return mapSpreeProductToProduct(productWithBreadcrumbCategory)
}
