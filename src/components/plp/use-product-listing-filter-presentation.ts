import { useEffect, useMemo, useState } from 'react'

import {
  findMatchingProductListingPriceBucket,
  getActiveFilterCount,
  getProductListingFilterSectionIds,
  getProductListingFilterGroups,
} from '@/lib/catalog/contracts'
import type {
  ProductListingFilterGroups,
  ProductListingFilters,
  ProductListingSearch,
} from '@/lib/catalog/contracts'

import { getProductListingPriceBucketDisplays } from './product-listing-price-filter-model'
import type { ProductListingPriceBucketDisplay } from './product-listing-price-filter-model'

export type ProductListingFilterPresentationOptions = {
  filterData: ProductListingFilterData
  draft: ProductListingSearch
  search: ProductListingSearch
  locale: string
}

export type ProductListingFilterData = ProductListingFilterGroups & {
  drawerSectionIds: string[]
}

export type ProductListingFilterPresentation = {
  appliedFilterCount: number
  appliedPriceBucket?: ProductListingPriceBucketDisplay
  availabilityFilter: ProductListingFilterGroups['availabilityFilter']
  drawerSectionIds: string[]
  draftFilterCount: number
  draftPriceBucket?: ProductListingPriceBucketDisplay
  optionFilters: ProductListingFilterGroups['optionFilters']
  priceBuckets: ProductListingPriceBucketDisplay[]
  priceFilter: ProductListingFilterGroups['priceFilter']
}

export function useProductListingFilterPresentation({
  draft,
  filterData,
  locale,
  search,
}: ProductListingFilterPresentationOptions): ProductListingFilterPresentation {
  const priceBuckets = useMemo(() => {
    if (!filterData.priceFilter) {
      return []
    }

    return getProductListingPriceBucketDisplays({
      currencyCode: filterData.priceFilter.currency,
      labels: {
        plus: (value) => `${value}+`,
        range: (minimum, maximum) => `${minimum} - ${maximum}`,
        under: (value) => `Under ${value}`,
      },
      locale,
      max: filterData.priceFilter.max,
      min: filterData.priceFilter.min,
    })
  }, [filterData.priceFilter, locale])

  const appliedPriceBucket = useMemo(
    () =>
      findMatchingProductListingPriceBucket(
        priceBuckets,
        search.price_min,
        search.price_max,
      ),
    [priceBuckets, search.price_max, search.price_min],
  )

  const draftPriceBucket = useMemo(
    () =>
      findMatchingProductListingPriceBucket(
        priceBuckets,
        draft.price_min,
        draft.price_max,
      ),
    [draft.price_max, draft.price_min, priceBuckets],
  )

  return {
    appliedFilterCount: getActiveFilterCount(search),
    appliedPriceBucket,
    availabilityFilter: filterData.availabilityFilter,
    drawerSectionIds: filterData.drawerSectionIds,
    draftFilterCount: getActiveFilterCount(draft),
    draftPriceBucket,
    optionFilters: filterData.optionFilters,
    priceBuckets,
    priceFilter: filterData.priceFilter,
  }
}

export function useProductListingFilterData({
  filters,
}: {
  filters: ProductListingFilters | null
}): ProductListingFilterData {
  const [lastGoodFilters, setLastGoodFilters] =
    useState<ProductListingFilters | null>(filters)
  const effectiveFilters = filters ?? lastGoodFilters

  useEffect(() => {
    if (filters) {
      setLastGoodFilters(filters)
    }
  }, [filters])

  return useMemo(
    () => ({
      ...getProductListingFilterGroups(effectiveFilters),
      drawerSectionIds: getProductListingFilterSectionIds(effectiveFilters),
    }),
    [effectiveFilters],
  )
}
