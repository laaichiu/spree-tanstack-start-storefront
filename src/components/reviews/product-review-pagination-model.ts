import type { ProductReviewPagination } from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'

export type ProductReviewPaginationPresentationLabels = {
  navigation: string
  next: string
  pageOf: string
  previous: string
}

export type ProductReviewPaginationPresentation = {
  hasNext: boolean
  hasPrevious: boolean
  isDisabled: boolean
  navigationLabel: string
  nextLabel: string
  pageLabel: string
  previousLabel: string
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
}): ProductReviewPaginationPresentation {
  const pageCount = Math.max(1, pagination.pageCount)

  return {
    hasNext: pagination.nextPage !== null,
    hasPrevious: pagination.previousPage !== null,
    isDisabled: disabled,
    navigationLabel: labels.navigation,
    nextLabel: labels.next,
    pageLabel: labels.pageOf
      .replace('{page}', formatNumber(pagination.page, locale))
      .replace('{pages}', formatNumber(pageCount, locale)),
    previousLabel: labels.previous,
  }
}
