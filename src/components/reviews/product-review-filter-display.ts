import type {
  ProductReviewFilter,
  ProductReviewFilters,
  ProductReviewQuery,
} from '@/lib/reviews/contracts'
import { getReviewFilterValue } from '@/lib/reviews/contracts'

export type ProductReviewFilterOptionDisplay = {
  label: string
  value: string
}

export type ProductReviewFilterDisplay = {
  id: string
  label: string
  options: ProductReviewFilterOptionDisplay[]
  value: string
}

export type ProductReviewFilterSectionDisplay = {
  id: string
  label: string
  options: ProductReviewFilterOptionDisplay[]
  selectedValue: string
}

function getVisibleReviewFilterValues(filter: ProductReviewFilter) {
  const valuesWithResults = filter.values.filter((value) => value.count > 0)

  return valuesWithResults.length ? valuesWithResults : filter.values
}

export function getVisibleReviewFilters(filters: ProductReviewFilters) {
  return filters.filters.filter(
    (filter) =>
      (filter.id === 'rating' || filter.id === 'with_images') &&
      filter.values.length > 0,
  )
}

function getReviewFilterOptionDisplays(
  filter: ProductReviewFilter,
  emptyOptionLabel: string,
): ProductReviewFilterOptionDisplay[] {
  return [
    { label: emptyOptionLabel, value: '' },
    ...getVisibleReviewFilterValues(filter).map(({ label, value }) => ({
      label,
      value,
    })),
  ]
}

export function getReviewFilterDisplays(
  filters: ProductReviewFilters,
  query: ProductReviewQuery,
  allReviewsLabel: string,
): ProductReviewFilterDisplay[] {
  return getVisibleReviewFilters(filters).map((filter) => ({
    id: filter.id,
    label: filter.label,
    options: getReviewFilterOptionDisplays(
      filter,
      filter.id === 'with_images' ? allReviewsLabel : filter.label,
    ),
    value: getReviewFilterValue(query, filter.id),
  }))
}

export function getReviewFilterSectionDisplays(
  filters: readonly ProductReviewFilter[],
  query: ProductReviewQuery,
  emptyOptionLabel: string,
): ProductReviewFilterSectionDisplay[] {
  return filters.map((filter) => ({
    id: filter.id,
    label: filter.label,
    options: getReviewFilterOptionDisplays(filter, emptyOptionLabel),
    selectedValue: getReviewFilterValue(query, filter.id),
  }))
}
