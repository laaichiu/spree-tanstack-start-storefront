import { useEffect, useMemo, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import {
  findMatchingBucket,
  formatOptionLabel,
  formatProductCount,
  generatePriceBuckets,
} from '@/components/plp/product-listing-filter-utils'
import type {
  ProductListingAvailability,
  ProductListingFilters,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/model/product-listing'
import { getActiveFilterCount } from '@/lib/catalog/utils/product-listing-search'

export function useProductListingFilterState({
  filters,
  onApply,
  search,
  totalCount,
}: {
  filters: ProductListingFilters | null
  onApply: (search: ProductListingSearch) => void
  search: ProductListingSearch
  totalCount: number
}) {
  const { market, t } = useMarket()
  const [lastGoodFilters, setLastGoodFilters] =
    useState<ProductListingFilters | null>(filters)
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductListingSearch>(search)
  const effectiveFilters = filters ?? lastGoodFilters

  useEffect(() => {
    if (filters) {
      setLastGoodFilters(filters)
    }
  }, [filters])

  useEffect(() => {
    if (!isOpen) {
      setDraft(search)
    }
  }, [isOpen, search])

  const { availabilityFilter, optionFilters, priceFilter } = useMemo(() => {
    const availableFilters = effectiveFilters?.filters ?? []

    return {
      availabilityFilter:
        availableFilters.find((filter) => filter.type === 'availability') ??
        null,
      optionFilters: availableFilters.filter(
        (filter) => filter.type === 'option',
      ),
      priceFilter:
        availableFilters.find((filter) => filter.type === 'price_range') ??
        null,
    }
  }, [effectiveFilters?.filters])

  const drawerSectionIds = useMemo(() => {
    const ids = optionFilters.map((filter) => filter.id)

    if (priceFilter) {
      ids.push('price')
    }

    if (availabilityFilter) {
      ids.push('availability')
    }

    return ids
  }, [availabilityFilter, optionFilters, priceFilter])

  const priceBuckets = useMemo(() => {
    if (!priceFilter) {
      return []
    }

    return generatePriceBuckets({
      currency: priceFilter.currency,
      locale: market.locale,
      max: priceFilter.max,
      min: priceFilter.min,
    })
  }, [market.locale, priceFilter])

  const appliedPriceBucket = useMemo(
    () => findMatchingBucket(priceBuckets, search.price_min, search.price_max),
    [priceBuckets, search.price_max, search.price_min],
  )

  const draftPriceBucket = useMemo(
    () => findMatchingBucket(priceBuckets, draft.price_min, draft.price_max),
    [draft.price_max, draft.price_min, priceBuckets],
  )

  const activeOptionMetaById = useMemo(() => {
    const optionMap = new Map<string, { filterLabel: string; label: string }>()

    for (const optionFilter of optionFilters) {
      for (const option of optionFilter.options) {
        optionMap.set(option.id, {
          filterLabel: optionFilter.label,
          label: formatOptionLabel(option),
        })
      }
    }

    return optionMap
  }, [optionFilters])

  const appliedFilterCount = getActiveFilterCount(search)
  const draftFilterCount = getActiveFilterCount(draft)
  const productCountLabel = formatProductCount({
    count: totalCount,
    locale: market.locale,
    productPlural: t('product.productPlural'),
    productSingular: t('product.productSingular'),
  })

  function prepareDrawer(sectionId?: string) {
    const fallbackSectionId =
      drawerSectionIds.length > 0 ? drawerSectionIds[0] : null

    setDraft(search)
    setExpandedSection(sectionId ?? fallbackSectionId)
  }

  function applySearch(nextSearch: ProductListingSearch) {
    onApply({
      ...nextSearch,
      page: 1,
    })
  }

  function applyDraft() {
    applySearch(draft)
    setIsOpen(false)
  }

  function clearAppliedFilters() {
    applySearch({
      ...search,
      availability: undefined,
      option: [],
      price_max: undefined,
      price_min: undefined,
    })
  }

  function clearDraftFilters() {
    setDraft((previous) => ({
      ...previous,
      availability: undefined,
      option: [],
      price_max: undefined,
      price_min: undefined,
    }))
  }

  function removeAppliedOption(optionId: string) {
    applySearch({
      ...search,
      option: search.option.filter((id) => id !== optionId),
    })
  }

  function removeAppliedPrice() {
    applySearch({
      ...search,
      price_max: undefined,
      price_min: undefined,
    })
  }

  function removeAppliedAvailability() {
    applySearch({
      ...search,
      availability: undefined,
    })
  }

  function toggleDraftOption(optionId: string) {
    setDraft((previous) => {
      const optionSet = new Set(previous.option)

      if (optionSet.has(optionId)) {
        optionSet.delete(optionId)
      } else {
        optionSet.add(optionId)
      }

      return {
        ...previous,
        option: [...optionSet],
      }
    })
  }

  function setDraftPrice(min?: number, max?: number) {
    setDraft((previous) => ({
      ...previous,
      price_max: max,
      price_min: min,
    }))
  }

  function setDraftAvailability(availability?: ProductListingAvailability) {
    setDraft((previous) => ({
      ...previous,
      availability,
    }))
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

  function toggleAccordionSection(sectionId: string) {
    setExpandedSection((current) => (current === sectionId ? null : sectionId))
  }

  return {
    activeOptionMetaById,
    appliedFilterCount,
    appliedPriceBucket,
    availabilityFilter,
    draft,
    draftFilterCount,
    draftPriceBucket,
    expandedSection,
    isOpen,
    optionFilters,
    priceBuckets,
    priceFilter,
    productCountLabel,
    t,
    applyDraft,
    clearAppliedFilters,
    clearDraftFilters,
    prepareDrawer,
    removeAppliedAvailability,
    removeAppliedOption,
    removeAppliedPrice,
    setDraftAvailability,
    setDraftPrice,
    setIsOpen,
    setSort,
    toggleAccordionSection,
    toggleDraftOption,
  }
}
