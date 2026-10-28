import type { ReactNode } from 'react'
import type { CatalogBreadcrumbDisplay } from './links'

export type ProductListingHeadingModel = {
  breadcrumbLabel: string
  breadcrumbs: readonly CatalogBreadcrumbDisplay[]
  categoryImageUrl: string | null
  description: string | null
  isCategoryPage: boolean
  title: string
}

export type ProductListingPaginationModel = {
  canGoNext: boolean
  canGoPrevious: boolean
  nextPageLabel: string
  pageLabel: string
  previousPageLabel: string
  rangeLabel: string | null
  totalPages: number
}

export type ProductListingPaginationActions = {
  next: () => void
  previous: () => void
}

export type ProductListingControlsSlots = {
  filterDrawer: ReactNode
  filterToolbar: ReactNode
}

export type ProductListingResultsState = 'empty' | 'error' | 'ready'

export type ProductListingResultsSlots = {
  empty: ReactNode
  error: ReactNode
  product: ReactNode
}

export type ProductListingFilterToolbarActions = {
  filterClick: (filterId: string) => void
  prepareDrawer: () => void
}

export type ProductListingFilterToolbarSlots = {
  activeFilters?: ReactNode
  desktopSort: ReactNode
  mobileSort: ReactNode
}

export type ProductListingFilterDrawerActions = {
  apply: () => void
  clear: () => void
}

export type ProductListingActiveFiltersActions = {
  clearAll: () => void
  removeAvailability: () => void
  removeOption: (optionId: string) => void
  removePrice: () => void
}

export type ProductListingPaginationProps = {
  actions: ProductListingPaginationActions
  model: ProductListingPaginationModel
}
