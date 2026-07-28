import type { SuggestedItemsIndicatorState } from './search-drawer.model'

export type PaginationMetrics = {
  element: HTMLUListElement
  maxScrollLeft: number
  pageCount: number
}

export function getPaginationMetrics(
  element: HTMLUListElement | null,
): PaginationMetrics | null {
  if (!element) {
    return null
  }

  const viewportWidth = element.clientWidth
  const scrollWidth = element.scrollWidth

  if (viewportWidth === 0 || scrollWidth === 0) {
    return null
  }

  return {
    element,
    maxScrollLeft: Math.max(0, scrollWidth - viewportWidth),
    pageCount: Math.max(1, Math.ceil(scrollWidth / viewportWidth)),
  }
}

export function getPaginationIndicator(
  element: HTMLUListElement,
): SuggestedItemsIndicatorState | null {
  const metrics = getPaginationMetrics(element)

  if (!metrics) {
    return null
  }

  const progress =
    metrics.maxScrollLeft === 0 ? 0 : element.scrollLeft / metrics.maxScrollLeft
  const activePage =
    metrics.maxScrollLeft === 0
      ? 0
      : Math.round(
          (element.scrollLeft / metrics.maxScrollLeft) *
            (metrics.pageCount - 1),
        )

  return {
    activePage,
    hasOverflow: metrics.maxScrollLeft > 0,
    pageCount: metrics.pageCount,
    progress,
    thumbWidthPercent: Math.min(
      100,
      (element.clientWidth / element.scrollWidth) * 100,
    ),
  }
}

export function getPageScrollLeft(
  metrics: PaginationMetrics,
  pageIndex: number,
) {
  if (metrics.maxScrollLeft === 0 || metrics.pageCount <= 1) {
    return null
  }

  const safePageIndex = Math.max(0, Math.min(pageIndex, metrics.pageCount - 1))

  return (metrics.maxScrollLeft * safePageIndex) / (metrics.pageCount - 1)
}
