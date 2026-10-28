import type { RefCallback } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { SearchSuggestionsIndicatorState } from '../contracts/search'
import { EMPTY_SUGGESTED_ITEMS_INDICATOR } from './search-suggestions-carousel.model'
import { getPaginationIndicator } from './search-suggestions-carousel.utils'

export function useSearchSuggestionsCarouselPaginationController({
  enabled,
  itemsKey,
  isOpen,
}: {
  enabled: boolean
  itemsKey: string
  isOpen: boolean
}) {
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const [scrollerElement, setScrollerElement] =
    useState<HTMLUListElement | null>(null)
  const [indicator, setIndicator] = useState<SearchSuggestionsIndicatorState>(
    EMPTY_SUGGESTED_ITEMS_INDICATOR,
  )
  const setScrollerRef = useCallback<RefCallback<HTMLUListElement>>(
    (element) => {
      scrollerRef.current = element
      setScrollerElement(element)
    },
    [],
  )

  useEffect(() => {
    if (!isOpen || !enabled) {
      setIndicator(EMPTY_SUGGESTED_ITEMS_INDICATOR)
      return
    }

    const element = scrollerElement

    if (!element) {
      return
    }

    element.scrollLeft = 0

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
  }, [enabled, isOpen, itemsKey, scrollerElement])

  return {
    indicator,
    scrollerRef,
    setScrollerRef,
  }
}
