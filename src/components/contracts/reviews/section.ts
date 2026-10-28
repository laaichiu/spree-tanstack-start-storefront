import type { ReactNode } from 'react'
import type { ProductReviewPaginationPresentation } from '@/components/reviews/product-review-pagination-model'

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

export type ProductReviewsPaginationModel = ProductReviewPaginationPresentation

export type ProductReviewsPaginationActions = {
  next: () => void
  previous: () => void
}
