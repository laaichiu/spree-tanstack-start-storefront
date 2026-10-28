import { useEffect, useState } from 'react'

import {
  resetProductListingSearchPage,
  updateProductListingSearch,
} from '@/lib/catalog/contracts'
import type {
  ProductListingAvailability,
  ProductListingSearch,
} from '@/lib/catalog/contracts'

type ProductListingFilterDraftOptions = {
  isOpen: boolean
  onApply: (search: ProductListingSearch) => void
  search: ProductListingSearch
  setIsOpen: (isOpen: boolean) => void
}

export function useProductListingFilterDraft({
  isOpen,
  onApply,
  search,
  setIsOpen,
}: ProductListingFilterDraftOptions) {
  const [draft, setDraft] = useState<ProductListingSearch>(search)

  useEffect(() => {
    if (!isOpen) {
      setDraft(search)
    }
  }, [isOpen, search])

  function resetDraft() {
    setDraft(search)
  }

  function applySearch(nextSearch: ProductListingSearch) {
    onApply(resetProductListingSearchPage(nextSearch))
  }

  function applyDraft() {
    applySearch(draft)
    setIsOpen(false)
  }

  function clearAppliedFilters() {
    applySearch(updateProductListingSearch(search, { type: 'clear-filters' }))
  }

  function clearDraftFilters() {
    setDraft((previous) =>
      updateProductListingSearch(previous, { type: 'clear-filters' }),
    )
  }

  function removeAppliedOption(optionId: string) {
    applySearch(
      updateProductListingSearch(search, {
        optionId,
        type: 'remove-option',
      }),
    )
  }

  function removeAppliedPrice() {
    applySearch(
      updateProductListingSearch(search, {
        max: undefined,
        min: undefined,
        type: 'set-price',
      }),
    )
  }

  function removeAppliedAvailability() {
    applySearch(
      updateProductListingSearch(search, {
        availability: undefined,
        type: 'set-availability',
      }),
    )
  }

  function toggleDraftOption(optionId: string) {
    setDraft((previous) =>
      updateProductListingSearch(previous, {
        optionId,
        type: 'toggle-option',
      }),
    )
  }

  function setDraftPrice(min?: number, max?: number) {
    setDraft((previous) =>
      updateProductListingSearch(previous, {
        max,
        min,
        type: 'set-price',
      }),
    )
  }

  function setDraftAvailability(availability?: ProductListingAvailability) {
    setDraft((previous) =>
      updateProductListingSearch(previous, {
        availability,
        type: 'set-availability',
      }),
    )
  }

  return {
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
  }
}
