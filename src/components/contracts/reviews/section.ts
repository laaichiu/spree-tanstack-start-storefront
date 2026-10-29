import type { ReactNode } from 'react'

export type ProductReviewsReadySectionModel = {
  isFetching: boolean
  loadingLabel: string
  sectionId: string
  title: string
}

export type ProductReviewsReadySectionSlots = {
  content: ReactNode
  controls: ReactNode
  mediaLightbox: ReactNode
  pagination: ReactNode
  summary: ReactNode
}

export type ProductReviewsUnavailableStateModel = {
  description: string
  sectionId: string
  title: string
}

export type ProductReviewsEmptyStateModel = {
  message: string
  sectionId: string
  title: string
}

export type ProductReviewsNoResultsStateModel = {
  description: string
  title: string
}

export type ProductReviewsLoadErrorStateModel = {
  description: string
  retryLabel: string
  title: string
}

export type ProductReviewsPaginationModel = {
  hasNext: boolean
  hasPrevious: boolean
  isDisabled: boolean
  navigationLabel: string
  nextLabel: string
  pageLabel: string
  pages: ReadonlyArray<{
    current: boolean
    label: string
    number: number
    visibleInCompactLayout: boolean
  }>
  previousLabel: string
}

export type ProductReviewsPaginationActions = {
  goToPage: (page: number) => void
  next: () => void
  previous: () => void
}
