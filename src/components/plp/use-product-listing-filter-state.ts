import { useProductListingFilterDraft } from './use-product-listing-filter-draft'
import { useProductListingFilterDrawer } from './use-product-listing-filter-drawer'
import {
  useProductListingFilterData,
  useProductListingFilterPresentation,
} from './use-product-listing-filter-presentation'

import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductListingFilters,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/contracts'

export function useProductListingFilterState({
  filters,
  onApply,
  search,
}: {
  filters: ProductListingFilters | null
  onApply: (search: ProductListingSearch) => void
  search: ProductListingSearch
}) {
  const { market, t } = useMarket()
  const filterData = useProductListingFilterData({ filters })

  const { expandedSection, isOpen, prepareSection, setIsOpen, toggleSection } =
    useProductListingFilterDrawer({ sectionIds: filterData.drawerSectionIds })

  const filterDraft = useProductListingFilterDraft({
    isOpen,
    onApply,
    search,
    setIsOpen,
  })
  const {
    applyDraft,
    applySearch,
    clearAppliedFilters,
    clearDraftFilters,
    draft,
    removeAppliedAvailability,
    removeAppliedOption,
    removeAppliedPrice,
    resetDraft,
    setDraftAvailability,
    setDraftPrice,
    toggleDraftOption,
  } = filterDraft

  const presentation = useProductListingFilterPresentation({
    draft,
    filterData,
    locale: market.locale,
    search,
  })

  function prepareDrawer(sectionId?: string) {
    resetDraft()
    prepareSection(sectionId)
  }

  function setSort(sort: ProductListingSort) {
    if (sort === search.sort) {
      return
    }

    applySearch({
      ...search,
      sort,
    })
  }

  return {
    ...presentation,
    applyDraft,
    clearAppliedFilters,
    clearDraftFilters,
    draft,
    expandedSection,
    isOpen,
    removeAppliedAvailability,
    removeAppliedOption,
    removeAppliedPrice,
    setDraftAvailability,
    setDraftPrice,
    t,
    prepareDrawer,
    setIsOpen,
    setSort,
    toggleSection,
    toggleDraftOption,
  }
}
