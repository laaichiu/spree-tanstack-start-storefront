import type { SearchSuggestionsIndicatorState } from '../contracts/search'

export const EMPTY_SUGGESTED_ITEMS_INDICATOR: SearchSuggestionsIndicatorState =
  {
    activePage: 0,
    hasOverflow: false,
    pageCount: 1,
    progress: 0,
    thumbWidthPercent: 100,
  }
