import type { DragEvent, MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import {
  MAX_SEARCH_SUGGESTIONS_CAROUSEL_VELOCITY,
  useSearchSuggestionsCarouselMomentum,
} from './use-search-suggestions-carousel-momentum'
import type { PaginationMetrics } from './search-suggestions-carousel.utils'

export function useSearchSuggestionsCarouselDragController({
  itemsKey,
  isOpen,
  measure,
  scrollerRef,
}: {
  itemsKey: string
  isOpen: boolean
  measure: () => PaginationMetrics | null
  scrollerRef: RefObject<HTMLUListElement | null>
}) {
  const dragStartXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastPointerXRef = useRef(0)
  const lastPointerTimeRef = useRef(0)
  const mouseMoveListenerRef = useRef<((event: MouseEvent) => void) | null>(
    null,
  )
  const mouseUpListenerRef = useRef<((event: MouseEvent) => void) | null>(null)
  const suppressClickRef = useRef(false)
  const {
    setVelocity,
    start: startMomentum,
    stop: stopMomentum,
    updateVelocity,
  } = useSearchSuggestionsCarouselMomentum({
    canStartRef: suppressClickRef,
    measure,
  })

  const removeMouseListeners = useCallback(() => {
    if (mouseMoveListenerRef.current) {
      window.removeEventListener('mousemove', mouseMoveListenerRef.current)
      mouseMoveListenerRef.current = null
    }

    if (mouseUpListenerRef.current) {
      window.removeEventListener('mouseup', mouseUpListenerRef.current)
      mouseUpListenerRef.current = null
    }
  }, [])

  const finishMouseDrag = useCallback(() => {
    removeMouseListeners()
    isDraggingRef.current = false
  }, [removeMouseListeners])

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLUListElement>) => {
      if (event.button !== 0) {
        return
      }

      const metrics = measure()

      if (!metrics || metrics.maxScrollLeft === 0) {
        return
      }

      stopMomentum()
      finishMouseDrag()
      isDraggingRef.current = true
      dragStartXRef.current = event.clientX
      lastPointerXRef.current = event.clientX
      lastPointerTimeRef.current = event.timeStamp
      suppressClickRef.current = false
      setVelocity(0)
      event.preventDefault()

      const handleWindowMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) {
          return
        }

        const element = scrollerRef.current

        if (!element) {
          return
        }

        const deltaXFromStart = moveEvent.clientX - dragStartXRef.current

        if (!suppressClickRef.current && Math.abs(deltaXFromStart) >= 6) {
          suppressClickRef.current = true
        }

        if (!suppressClickRef.current) {
          return
        }

        const deltaX = moveEvent.clientX - lastPointerXRef.current
        const deltaTime = Math.max(
          1,
          moveEvent.timeStamp - lastPointerTimeRef.current,
        )
        const nextVelocity = Math.max(
          -MAX_SEARCH_SUGGESTIONS_CAROUSEL_VELOCITY,
          Math.min(
            MAX_SEARCH_SUGGESTIONS_CAROUSEL_VELOCITY,
            -deltaX / deltaTime,
          ),
        )

        element.scrollLeft -= deltaX
        lastPointerXRef.current = moveEvent.clientX
        lastPointerTimeRef.current = moveEvent.timeStamp
        updateVelocity(nextVelocity)
        moveEvent.preventDefault()
      }

      const handleWindowMouseUp = () => {
        finishMouseDrag()
        startMomentum()
      }

      mouseMoveListenerRef.current = handleWindowMouseMove
      mouseUpListenerRef.current = handleWindowMouseUp
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
    },
    [
      finishMouseDrag,
      measure,
      scrollerRef,
      setVelocity,
      startMomentum,
      stopMomentum,
      updateVelocity,
    ],
  )

  const handleClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLUListElement>) => {
      if (!suppressClickRef.current) {
        return
      }

      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
    },
    [],
  )

  const handleDragStart = useCallback((event: DragEvent<HTMLUListElement>) => {
    event.preventDefault()
  }, [])

  useEffect(() => {
    if (isOpen) {
      return
    }

    stopMomentum()
    finishMouseDrag()
    setVelocity(0)
    suppressClickRef.current = false
  }, [finishMouseDrag, isOpen, setVelocity, stopMomentum])

  useEffect(() => {
    stopMomentum()
    finishMouseDrag()
    setVelocity(0)
    suppressClickRef.current = false
  }, [finishMouseDrag, itemsKey, setVelocity, stopMomentum])

  useEffect(() => {
    return () => {
      stopMomentum()
      finishMouseDrag()
      setVelocity(0)
      suppressClickRef.current = false
    }
  }, [finishMouseDrag, setVelocity, stopMomentum])

  return {
    onClickCapture: handleClickCapture,
    onDragStart: handleDragStart,
    onMouseDownCapture: handleMouseDown,
    stopMomentum,
  }
}
