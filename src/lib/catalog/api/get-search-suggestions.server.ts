import '@tanstack/react-start/server-only'

import type { PaginatedResponse } from '@spree/sdk'

import {
  SEARCH_CATEGORY_LINK_LIMIT,
  SEARCH_SUGGESTION_POSITION_FILTER,
} from '@/config/search'
import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { SEARCH_SUGGESTION_LIMIT } from '../contracts/search'
import {
  mapSearchSuggestionCategories,
  mapSearchSuggestionProducts,
  SearchSuggestionResponseError,
} from '../mappers/search-suggestions.mapper'
import { assertCatalogListResponse } from '../utils/catalog-list-response'
import { assertCatalogListingPaginationMeta } from '../utils/catalog-pagination-response'

const PAGE_SIZE = 100
const MAX_PAGES = 100

async function loadSearchSuggestionResources<T>(
  loadPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const resources: T[] = []
  let pages = 1
  for (let page = 1; page <= pages; page += 1) {
    const response = await loadPage(page)
    assertCatalogListResponse(response)
    assertCatalogListingPaginationMeta(response.meta)
    if (
      response.meta.page !== page ||
      response.meta.pages > MAX_PAGES ||
      (response.meta.pages === 0 &&
        (page !== 1 ||
          response.data.length > 0 ||
          response.meta.count !== 0)) ||
      (response.meta.pages > 0 && page > response.meta.pages)
    ) {
      throw new SearchSuggestionResponseError()
    }
    pages = response.meta.pages
    resources.push(...response.data)
  }
  return resources
}

export async function getSearchSuggestionProductsForMarket(
  market: ResolvedMarket,
) {
  const client = getServerSpreeClientForMarket(market)
  const products = await loadSearchSuggestionResources((page) =>
    client.products.list({
      [`${SEARCH_SUGGESTION_POSITION_FILTER}_gt`]: 0,
      expand: [
        'custom_fields',
        'seller',
        'primary_media',
        'default_variant',
        'default_variant.primary_media',
      ],
      limit: PAGE_SIZE,
      page,
      // Keep pagination stable when multiple records share a configured rank.
      // The mapper orders the complete selection by rank and opaque ID.
      sort: 'id',
    }),
  )
  return mapSearchSuggestionProducts(products, SEARCH_SUGGESTION_LIMIT)
}

export async function getSearchSuggestionCategoriesForMarket(
  market: ResolvedMarket,
) {
  const client = getServerSpreeClientForMarket(market)
  // Custom-field filtering is a Product API contract. Read every public
  // category page so a selected child or later page is not silently omitted.
  const categories = await loadSearchSuggestionResources((page) =>
    client.categories.list({
      expand: ['custom_fields'],
      limit: PAGE_SIZE,
      page,
      sort: 'id',
    }),
  )
  return mapSearchSuggestionCategories(categories, SEARCH_CATEGORY_LINK_LIMIT)
}
