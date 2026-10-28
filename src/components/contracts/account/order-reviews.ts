import type { ReactNode } from 'react'

export type AccountOrderReviewItem = {
  active: boolean
  id: string
  imageUrl?: string
  name: string
  optionsText: string
  submitted: boolean
}

export type AccountOrderReviewsLabels = {
  cancel: string
  description: string
  submitted: string
  title: string
  writeReview: string
}

export type AccountOrderReviewsModel = {
  items: readonly AccountOrderReviewItem[]
  labels: AccountOrderReviewsLabels
}

export type AccountOrderReviewsProps = {
  model: AccountOrderReviewsModel
  onToggleItem: (itemId: string) => void
  renderReviewForm: (itemId: string) => ReactNode
}
