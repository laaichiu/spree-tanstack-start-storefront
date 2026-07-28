export const CATEGORY_LINK_LIMIT = 8
export const POPULAR_SEARCH_LIMIT = 5
export const SEARCH_PREVIEW_MIN_QUERY_LENGTH = 2
export const SEARCH_SUGGESTION_LIMIT = 8

export type SuggestedItemsIndicatorState = {
  activePage: number
  hasOverflow: boolean
  pageCount: number
  progress: number
  thumbWidthPercent: number
}

export const EMPTY_SUGGESTED_ITEMS_INDICATOR: SuggestedItemsIndicatorState = {
  activePage: 0,
  hasOverflow: false,
  pageCount: 1,
  progress: 0,
  thumbWidthPercent: 100,
}

export const searchDrawerTextLinkClass =
  'link-underline-sweep block w-fit max-w-full text-left after:bottom-0 focus-visible:focus-ring'
