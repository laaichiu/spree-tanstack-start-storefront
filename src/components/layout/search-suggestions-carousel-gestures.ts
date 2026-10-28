import type { DragEvent, MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { useCallback } from 'react'

import {
  getPageScrollLeft,
  getPaginationMetrics,
} from './search-suggestions-carousel.utils'
import { useSearchSuggestionsCarouselDragController } from './use-search-suggestions-carousel-drag-controller'

type SearchSuggestionsCarouselGestures = {
  onClickCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  onDragStart: (event: DragEvent<HTMLUListElement>) => void
  onMouseDownCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void
}

export function useSearchSuggestionsCarouselGestures({
  itemsKey,
  isOpen,
  scrollerRef,
}: {
  itemsKey: string
  isOpen: boolean
  scrollerRef: RefObject<HTMLUListElement | null>
}): SearchSuggestionsCarouselGestures {
  const measure = useCallback(
    () => getPaginationMetrics(scrollerRef.current),
    [scrollerRef],
  )
  const drag = useSearchSuggestionsCarouselDragController({
    itemsKey,
    isOpen,
    measure,
    scrollerRef,
  })

  const scrollToPage = useCallback(
    (pageIndex: number, behavior: ScrollBehavior = 'smooth') => {
      const metrics = measure()

      if (!metrics) {
        return
      }

      const targetScrollLeft = getPageScrollLeft(metrics, pageIndex)

      if (targetScrollLeft === null) {
        return
      }

      drag.stopMomentum()
      metrics.element.scrollTo({ behavior, left: targetScrollLeft })
    },
    [drag.stopMomentum, measure],
  )

  return {
    onClickCapture: drag.onClickCapture,
    onDragStart: drag.onDragStart,
    onMouseDownCapture: drag.onMouseDownCapture,
    scrollToPage,
  }
}
