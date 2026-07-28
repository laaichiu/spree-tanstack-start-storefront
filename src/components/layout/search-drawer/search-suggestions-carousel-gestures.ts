import type { DragEvent, MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import {
  getPageScrollLeft,
  getPaginationMetrics,
} from './search-suggestions-carousel.utils'

const MOMENTUM_STOP_THRESHOLD = 0.02
const MAX_VELOCITY = 2.4

type SearchSuggestionsCarouselGestures = {
  onClickCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  onDragStart: (event: DragEvent<HTMLUListElement>) => void
  onMouseDownCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  scrollToPage: (pageIndex: number, behavior?: ScrollBehavior) => void
}

export function useSearchSuggestionsCarouselGestures({
  isOpen,
  scrollerRef,
}: {
  isOpen: boolean
  scrollerRef: RefObject<HTMLUListElement | null>
}): SearchSuggestionsCarouselGestures {
  const dragStartXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastPointerXRef = useRef(0)
  const lastPointerTimeRef = useRef(0)
  const momentumFrameRef = useRef<number | null>(null)
  const mouseMoveListenerRef = useRef<((event: MouseEvent) => void) | null>(
    null,
  )
  const mouseUpListenerRef = useRef<((event: MouseEvent) => void) | null>(null)
  const suppressClickRef = useRef(false)
  const velocityRef = useRef(0)

  const measure = useCallback(
    () => getPaginationMetrics(scrollerRef.current),
    [scrollerRef],
  )

  const stopMomentum = useCallback(() => {
    const frameId = momentumFrameRef.current

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      momentumFrameRef.current = null
    }
  }, [])

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

  const startMomentum = useCallback(() => {
    const metrics = measure()

    if (!metrics || !suppressClickRef.current) {
      return
    }

    let velocity = velocityRef.current

    if (Math.abs(velocity) < MOMENTUM_STOP_THRESHOLD) {
      velocityRef.current = 0
      return
    }

    stopMomentum()
    let lastFrameTime = performance.now()

    const continueMomentum = (currentFrameTime: number) => {
      const nextMetrics = measure()

      if (!nextMetrics) {
        momentumFrameRef.current = null
        velocityRef.current = 0
        return
      }

      const frameDelta = Math.min(32, currentFrameTime - lastFrameTime)
      lastFrameTime = currentFrameTime
      nextMetrics.element.scrollLeft += velocity * frameDelta
      velocity *= 0.95 ** (frameDelta / 16)

      const reachedStart = nextMetrics.element.scrollLeft <= 0
      const reachedEnd =
        nextMetrics.element.scrollLeft >= nextMetrics.maxScrollLeft

      if (
        reachedStart ||
        reachedEnd ||
        Math.abs(velocity) < MOMENTUM_STOP_THRESHOLD
      ) {
        momentumFrameRef.current = null
        velocityRef.current = 0
        return
      }

      velocityRef.current = velocity
      momentumFrameRef.current = window.requestAnimationFrame(continueMomentum)
    }

    momentumFrameRef.current = window.requestAnimationFrame(continueMomentum)
  }, [measure, stopMomentum])

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
      velocityRef.current = 0
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
          -MAX_VELOCITY,
          Math.min(MAX_VELOCITY, -deltaX / deltaTime),
        )

        element.scrollLeft -= deltaX
        lastPointerXRef.current = moveEvent.clientX
        lastPointerTimeRef.current = moveEvent.timeStamp
        velocityRef.current = velocityRef.current * 0.35 + nextVelocity * 0.65
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
    [finishMouseDrag, measure, scrollerRef, startMomentum, stopMomentum],
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

  const scrollToPage = useCallback(
    (pageIndex: number, behavior: ScrollBehavior = 'smooth') => {
      const metrics = measure()
      const targetScrollLeft = metrics
        ? getPageScrollLeft(metrics, pageIndex)
        : null

      if (targetScrollLeft === null || !metrics) {
        return
      }

      stopMomentum()
      metrics.element.scrollTo({ behavior, left: targetScrollLeft })
    },
    [measure, stopMomentum],
  )

  useEffect(() => {
    if (isOpen) {
      return
    }

    stopMomentum()
    finishMouseDrag()
  }, [finishMouseDrag, isOpen, stopMomentum])

  useEffect(() => {
    return () => {
      stopMomentum()
      finishMouseDrag()
    }
  }, [finishMouseDrag, stopMomentum])

  return {
    onClickCapture: handleClickCapture,
    onDragStart: handleDragStart,
    onMouseDownCapture: handleMouseDown,
    scrollToPage,
  }
}
