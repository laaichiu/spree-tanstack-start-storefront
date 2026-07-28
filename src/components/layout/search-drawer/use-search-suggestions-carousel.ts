import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  RefCallback,
} from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { EMPTY_SUGGESTED_ITEMS_INDICATOR } from './search-drawer.model'
import type { SuggestedItemsIndicatorState } from './search-drawer.model'
import { useSearchSuggestionsCarouselGestures } from './search-suggestions-carousel-gestures'
import { getPaginationIndicator } from './search-suggestions-carousel.utils'

export type SearchSuggestionsCarousel = {
  indicator: SuggestedItemsIndicatorState
  onClickCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  onDragStart: (event: DragEvent<HTMLUListElement>) => void
  onMouseDownCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  scrollerRef: RefCallback<HTMLUListElement>
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void
}

export function useSearchSuggestionsCarousel({
  enabled,
  isOpen,
}: {
  enabled: boolean
  isOpen: boolean
}): SearchSuggestionsCarousel {
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const [scrollerElement, setScrollerElement] =
    useState<HTMLUListElement | null>(null)
  const [indicator, setIndicator] = useState<SuggestedItemsIndicatorState>(
    EMPTY_SUGGESTED_ITEMS_INDICATOR,
  )
  const setScrollerRef = useCallback<RefCallback<HTMLUListElement>>(
    (element) => {
      scrollerRef.current = element
      setScrollerElement(element)
    },
    [],
  )
  const gestures = useSearchSuggestionsCarouselGestures({
    isOpen,
    scrollerRef,
  })

  useEffect(() => {
    if (!isOpen || !enabled) {
      setIndicator(EMPTY_SUGGESTED_ITEMS_INDICATOR)
      return
    }

    const element = scrollerElement

    if (!element) {
      return
    }

    const updatePagination = () => {
      const nextIndicator = getPaginationIndicator(element)

      if (!nextIndicator) {
        return
      }

      setIndicator((current) => {
        if (
          current.activePage === nextIndicator.activePage &&
          current.hasOverflow === nextIndicator.hasOverflow &&
          current.pageCount === nextIndicator.pageCount &&
          Math.abs(current.progress - nextIndicator.progress) < 0.001 &&
          Math.abs(
            current.thumbWidthPercent - nextIndicator.thumbWidthPercent,
          ) < 0.1
        ) {
          return current
        }

        return nextIndicator
      })
    }

    updatePagination()
    const frameId = window.requestAnimationFrame(updatePagination)
    element.addEventListener('scroll', updatePagination, { passive: true })
    window.addEventListener('resize', updatePagination)

    let resizeObserver: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updatePagination)
      resizeObserver.observe(element)
    }

    return () => {
      window.cancelAnimationFrame(frameId)
      element.removeEventListener('scroll', updatePagination)
      window.removeEventListener('resize', updatePagination)
      resizeObserver?.disconnect()
    }
  }, [enabled, isOpen, scrollerElement])

  return {
    indicator,
    onClickCapture: gestures.onClickCapture,
    onDragStart: gestures.onDragStart,
    onMouseDownCapture: gestures.onMouseDownCapture,
    scrollerRef: setScrollerRef,
    scrollToPage: gestures.scrollToPage,
  }
}
