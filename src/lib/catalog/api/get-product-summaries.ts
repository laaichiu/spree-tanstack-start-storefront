import type { Client, ProductListParams } from '@spree/sdk'

import {
  mapSpreePaginationMetaToListingMeta,
  mapSpreeProductFiltersToListingFilters,
} from '../mappers/product-listing.mapper'
import { mapSpreeProductsToSummaries } from '../mappers/product.mapper'
import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductListingSearch,
  ProductSummary,
} from '@/lib/catalog/contracts'
import { toProductFiltersParams } from './product-listing-params'
import {
  assertCatalogProductNestedCategoriesAreCategories,
  assertCatalogProductNestedMediaBelongToProduct,
  assertCatalogProductNestedVariantsBelongToProduct,
  assertCatalogProductResourceIsProduct,
} from '../utils/catalog-resource-identity'
import { assertCatalogListResponse } from '../utils/catalog-list-response'
import { assertCatalogListingPaginationMeta } from '../utils/catalog-pagination-response'
import { assertCatalogProductResponse } from '../mappers/product-response'

const DISPLAY_VARIANT_EXPAND = [
  'seller',
  'primary_media',
  'default_variant',
  'default_variant.primary_media',
]
const FULL_VARIANT_EXPAND = [
  'seller',
  'primary_media',
  'default_variant',
  'default_variant.primary_media',
  'variants',
  'variants.primary_media',
]

type ProductSummaryRequestOptions = {
  includeVariants?: boolean
}

export async function getProductSummaries(
  client: Client,
  params: ProductListParams = {},
  options: ProductSummaryRequestOptions = {},
): Promise<ProductSummary[]> {
  const response = await client.products.list({
    expand: options.includeVariants
      ? FULL_VARIANT_EXPAND
      : DISPLAY_VARIANT_EXPAND,
    ...params,
  })
  assertCatalogListResponse(response)
  response.data.forEach((product) => {
    assertCatalogProductResourceIsProduct(product)
    assertCatalogProductNestedCategoriesAreCategories(product)
    assertCatalogProductNestedVariantsBelongToProduct(product)
    assertCatalogProductResponse(product)
    assertCatalogProductNestedMediaBelongToProduct(product)
  })

  return mapSpreeProductsToSummaries(response.data)
}

export async function getProductListing(
  client: Client,
  params: ProductListParams = {},
  options: ProductSummaryRequestOptions = { includeVariants: true },
): Promise<{
  meta: ProductListingMeta
  products: ProductSummary[]
}> {
  const response = await client.products.list({
    expand: options.includeVariants
      ? FULL_VARIANT_EXPAND
      : DISPLAY_VARIANT_EXPAND,
    ...params,
  })
  assertCatalogListResponse(response)
  response.data.forEach((product) => {
    assertCatalogProductResourceIsProduct(product)
    assertCatalogProductNestedCategoriesAreCategories(product)
    assertCatalogProductNestedVariantsBelongToProduct(product)
    assertCatalogProductResponse(product)
    assertCatalogProductNestedMediaBelongToProduct(product)
  })
  assertCatalogListingPaginationMeta(response.meta)

  return {
    meta: mapSpreePaginationMetaToListingMeta(response.meta),
    products: mapSpreeProductsToSummaries(response.data),
  }
}

export async function getProductListingFilters(
  client: Client,
  search: ProductListingSearch,
  options?: {
    categoryId?: string
    sellerId?: string
  },
): Promise<ProductListingFilters> {
  const response = await client.products.filters(
    toProductFiltersParams(search, options),
  )

  return mapSpreeProductFiltersToListingFilters(response)
}
