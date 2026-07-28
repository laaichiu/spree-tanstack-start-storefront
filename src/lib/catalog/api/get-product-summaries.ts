import type { Client, ProductListParams } from '@spree/sdk'

import {
  mapSpreePaginationMetaToListingMeta,
  mapSpreeProductFiltersToListingFilters,
} from '../mappers/product-listing.mapper'
import { mapSpreeProductsToSummaries } from '../mappers/product.mapper'
import type { ProductSummary } from '../model/product'
import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductListingSearch,
} from '../model/product-listing'
import { toProductFiltersParams } from './product-listing-params'

export async function getProductSummaries(
  client: Client,
  params: ProductListParams = {},
): Promise<ProductSummary[]> {
  const response = await client.products.list({
    expand: ['primary_media'],
    ...params,
  })

  return mapSpreeProductsToSummaries(response.data)
}

export async function getProductListing(
  client: Client,
  params: ProductListParams = {},
): Promise<{
  meta: ProductListingMeta
  products: ProductSummary[]
}> {
  const response = await client.products.list({
    expand: ['primary_media'],
    ...params,
  })

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
  },
): Promise<ProductListingFilters> {
  const response = await client.products.filters(
    toProductFiltersParams(search, options),
  )

  return mapSpreeProductFiltersToListingFilters(response)
}
