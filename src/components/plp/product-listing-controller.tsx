import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductListingPageModel } from '@/lib/catalog/model/product-listing-page'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'
import { formatNumber } from '@/lib/i18n/messages'

export type ProductListingPaginationController = {
  canGoNext: boolean
  canGoPrevious: boolean
  currentPage: number
  goToNext: () => void
  goToPrevious: () => void
  pageLabel: string
  rangeLabel: string | null
  totalPages: number
}

export type ProductListingControllerValue = {
  applySearch: (search: ProductListingSearch) => void
  page: ProductListingPageModel
  pagination: ProductListingPaginationController
  totalCount: number
}

type ProductListingControllerProps = {
  children: (controller: ProductListingControllerValue) => ReactNode
  onApply: (search: ProductListingSearch) => void
  page: ProductListingPageModel
}

export function ProductListingController({
  children,
  onApply,
  page,
}: ProductListingControllerProps) {
  const { market, t } = useMarket()
  const { meta, products, search, status } = page
  const totalCount = meta?.count ?? products.length
  const hasResults = status === 'ready' && totalCount > 0
  const currentPage = meta?.page ?? search.page
  const totalPages = Math.max(1, meta?.pages ?? 1)
  const from = meta?.from ?? (products.length > 0 ? 1 : 0)
  const to = meta?.to ?? products.length
  const rangeLabel = hasResults
    ? `${t('product.showing')} ${formatNumber(from, market.locale)} - ${formatNumber(
        to,
        market.locale,
      )} ${t('product.of')} ${formatNumber(totalCount, market.locale)} ${
        totalCount === 1
          ? t('product.productSingular')
          : t('product.productPlural')
      }`
    : null

  function goToPage(nextPage: number) {
    if (
      status !== 'ready' ||
      nextPage === currentPage ||
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return
    }

    onApply({
      ...search,
      page: nextPage,
    })
  }

  return children({
    applySearch: onApply,
    page,
    pagination: {
      canGoNext: currentPage < totalPages,
      canGoPrevious: currentPage > 1,
      currentPage,
      goToNext: () => goToPage(currentPage + 1),
      goToPrevious: () => goToPage(currentPage - 1),
      pageLabel: `${formatNumber(currentPage, market.locale)} / ${formatNumber(
        totalPages,
        market.locale,
      )}`,
      rangeLabel,
      totalPages,
    },
    totalCount,
  })
}
