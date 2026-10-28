import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  RefCallback,
} from 'react'

import type { SearchSuggestionsIndicatorState } from './suggestions'

export type SearchSuggestionsCarouselState = {
  indicator: SearchSuggestionsIndicatorState
}

export type SearchSuggestionsCarouselActions = {
  onClickCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  onDragStart: (event: DragEvent<HTMLUListElement>) => void
  onMouseDownCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  scrollerRef: RefCallback<HTMLUListElement>
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void
}

export type SearchSuggestionsCarouselController = {
  actions: SearchSuggestionsCarouselActions
  state: SearchSuggestionsCarouselState
}
