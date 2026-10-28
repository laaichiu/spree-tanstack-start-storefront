import '@tanstack/react-start/server-only'

import type { Category } from '@spree/sdk'

import type { ResolvedMarket } from '@/lib/core/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  CategoryNavigationResponseError,
  mapSpreeCategoriesToNavigationItems,
} from '../mappers/category-navigation.mapper'
import { assertCatalogListResponse } from '../utils/catalog-list-response'
import { assertCatalogCategoryTreeResourcesAreCategories } from '../utils/catalog-resource-identity'
import { assertCatalogListingPaginationMeta } from '../utils/catalog-pagination-response'

const PAGE_SIZE = 100
const MAX_PAGES = 100

export async function getNavigationCategoriesForMarket({
  limit = 7,
  market,
}: {
  limit?: number
  market: ResolvedMarket
}) {
  const client = getServerSpreeClientForMarket(market)
  const categories: Category[] = []
  let pages = 1
  let count: number | undefined
  for (let page = 1; page <= pages; page += 1) {
    const response = await client.categories.list({
      limit: PAGE_SIZE,
      page,
      sort: 'lft',
    })
    assertCatalogListResponse(response)
    assertCatalogCategoryTreeResourcesAreCategories(response.data)
    assertCatalogListingPaginationMeta(response.meta)
    const meta = response.meta
    const expectedPages = Math.ceil(meta.count / PAGE_SIZE)
    const offset = (page - 1) * PAGE_SIZE
    const length = Math.min(PAGE_SIZE, Math.max(0, meta.count - offset))
    if (
      meta.page !== page ||
      meta.limit !== PAGE_SIZE ||
      !Number.isSafeInteger(meta.count) ||
      meta.pages > MAX_PAGES ||
      (meta.count === 0
        ? page !== 1 || (meta.pages !== 0 && meta.pages !== 1)
        : meta.pages !== expectedPages || page > meta.pages) ||
      response.data.length !== length ||
      meta.from !== (length === 0 ? 0 : offset + 1) ||
      meta.to !== (length === 0 ? 0 : offset + length) ||
      (count !== undefined && (meta.count !== count || meta.pages !== pages))
    ) {
      throw new CategoryNavigationResponseError()
    }
    count = meta.count
    pages = meta.pages
    categories.push(...response.data)
  }

  return mapSpreeCategoriesToNavigationItems(categories, limit)
}
