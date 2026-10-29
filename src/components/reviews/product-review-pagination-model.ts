import type { ProductReviewPagination } from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'
import type { ProductReviewsPaginationModel } from '@/components/contracts/reviews'

type ProductReviewPaginationPresentationLabels = {
  navigation: string
  next: string
  pageOf: string
  previous: string
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
  const firstPage = Math.max(1, Math.min(pagination.page - 2, pageCount - 4))
  const visibleCount = Math.min(5, pageCount)

  return {
    hasNext: pagination.nextPage !== null,
    hasPrevious: pagination.previousPage !== null,
    isDisabled: disabled,
    navigationLabel: labels.navigation,
    nextLabel: labels.next,
    pageLabel: labels.pageOf
      .replace('{page}', formatNumber(pagination.page, locale))
      .replace('{pages}', formatNumber(pageCount, locale)),
    pages: Array.from({ length: visibleCount }, (_, index) => {
      const number = firstPage + index

      return {
        current: number === pagination.page,
        label: formatNumber(number, locale),
        number,
      }
    }),
    previousLabel: labels.previous,
  }
}
