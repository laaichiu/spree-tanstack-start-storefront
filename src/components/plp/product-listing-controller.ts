import { getProductListingPagination } from '@/lib/catalog/contracts'
import type {
  ProductListingPageModel,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { getCatalogCountLabel } from '@/components/catalog/catalog-count-label'
import { formatNumber } from '@/components/shared/locale-format'

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

export function getProductListingController({
  market,
  onApply,
  page,
  t,
}: {
  market: { locale: string }
  onApply: (search: ProductListingSearch) => void
  page: ProductListingPageModel
  t: (key: MessageKey) => string
}): ProductListingControllerValue {
  const pagination = getProductListingPagination(page)
  const rangeLabel = pagination.hasResults
    ? `${t('product.showing')} ${formatNumber(
        pagination.from,
        market.locale,
      )} - ${formatNumber(pagination.to, market.locale)} ${t('product.of')} ${getCatalogCountLabel(
        pagination.totalCount,
        market.locale,
        {
          plural: t('product.productPlural'),
          singular: t('product.productSingular'),
        },
      )}`
    : null

  function goToPage(nextPage: number) {
    if (
      page.status !== 'ready' ||
      nextPage === pagination.currentPage ||
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return
    }

    onApply({
      ...page.search,
      page: nextPage,
    })
  }

  return {
    applySearch: onApply,
    page,
    pagination: {
      canGoNext: pagination.canGoNext,
      canGoPrevious: pagination.canGoPrevious,
      currentPage: pagination.currentPage,
      goToNext: () => goToPage(pagination.currentPage + 1),
      goToPrevious: () => goToPage(pagination.currentPage - 1),
      pageLabel: `${formatNumber(
        pagination.currentPage,
        market.locale,
      )} / ${formatNumber(pagination.totalPages, market.locale)}`,
      rangeLabel,
      totalPages: pagination.totalPages,
    },
    totalCount: pagination.totalCount,
  }
}
