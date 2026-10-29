import type { ProductReviewPagination } from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'
import type { ProductReviewsPaginationModel } from '@/components/contracts/reviews'

type ProductReviewPaginationPresentationLabels = {
  navigation: string
  next: string
  pageOf: string
  previous: string
}

function getFirstPageInWindow(
  currentPage: number,
  pageCount: number,
  windowSize: number,
) {
  const pagesBeforeCurrent = Math.floor(windowSize / 2)

  return Math.max(
    1,
    Math.min(currentPage - pagesBeforeCurrent, pageCount - windowSize + 1),
  )
}

export function getProductReviewPaginationPresentation({
  disabled,
  labels,
  locale,
  pagination,
}: {
  disabled: boolean
  labels: ProductReviewPaginationPresentationLabels
  locale: string
  pagination: Pick<
    ProductReviewPagination,
    'nextPage' | 'page' | 'pageCount' | 'previousPage'
  >
}): ProductReviewsPaginationModel {
  const pageCount = Math.max(1, pagination.pageCount)
  const pageWindowSize = Math.min(5, pageCount)
  const compactPageWindowSize = Math.min(3, pageCount)
  const firstVisiblePage = getFirstPageInWindow(
    pagination.page,
    pageCount,
    pageWindowSize,
  )
  const firstCompactVisiblePage = getFirstPageInWindow(
    pagination.page,
    pageCount,
    compactPageWindowSize,
  )

  return {
    hasNext: pagination.nextPage !== null,
    hasPrevious: pagination.previousPage !== null,
    isDisabled: disabled,
    navigationLabel: labels.navigation,
    nextLabel: labels.next,
    pageLabel: labels.pageOf
      .replace('{page}', formatNumber(pagination.page, locale))
      .replace('{pages}', formatNumber(pageCount, locale)),
    pages: Array.from({ length: pageWindowSize }, (_, index) => {
      const number = firstVisiblePage + index

      return {
        current: number === pagination.page,
        label: formatNumber(number, locale),
        number,
        visibleInCompactLayout:
          number >= firstCompactVisiblePage &&
          number < firstCompactVisiblePage + compactPageWindowSize,
      }
    }),
    previousLabel: labels.previous,
  }
}
