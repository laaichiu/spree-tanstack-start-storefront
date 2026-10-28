import type {
  SearchSuggestionsCarouselActions,
  SearchSuggestionsCarouselController,
  SearchSuggestionsCarouselState,
} from '../contracts/search'
import { useSearchSuggestionsCarouselGestures } from './search-suggestions-carousel-gestures'
import { useSearchSuggestionsCarouselPaginationController } from './use-search-suggestions-carousel-pagination-controller'

export function useSearchSuggestionsCarousel({
  enabled,
  itemsKey,
  isOpen,
}: {
  enabled: boolean
  itemsKey: string
  isOpen: boolean
}): SearchSuggestionsCarouselController {
  const { indicator, scrollerRef, setScrollerRef } =
    useSearchSuggestionsCarouselPaginationController({
      enabled,
      itemsKey,
      isOpen,
    })
  const gestures = useSearchSuggestionsCarouselGestures({
    itemsKey,
    isOpen,
    scrollerRef,
  })

  const state: SearchSuggestionsCarouselState = {
    indicator,
  }
  const actions: SearchSuggestionsCarouselActions = {
    onClickCapture: gestures.onClickCapture,
    onDragStart: gestures.onDragStart,
    onMouseDownCapture: gestures.onMouseDownCapture,
    scrollerRef: setScrollerRef,
    scrollToPage: gestures.scrollToPage,
  }

  return {
    actions,
    state,
  }
}
