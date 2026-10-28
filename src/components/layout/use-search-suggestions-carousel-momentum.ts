import { useCallback, useEffect, useRef } from 'react'

import type { PaginationMetrics } from './search-suggestions-carousel.utils'

const MOMENTUM_STOP_THRESHOLD = 0.02
export const MAX_SEARCH_SUGGESTIONS_CAROUSEL_VELOCITY = 2.4

export function useSearchSuggestionsCarouselMomentum({
  canStartRef,
  measure,
}: {
  canStartRef: { current: boolean }
  measure: () => PaginationMetrics | null
}) {
  const frameRef = useRef<number | null>(null)
  const velocityRef = useRef(0)

  const stop = useCallback(() => {
    const frameId = frameRef.current

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      frameRef.current = null
    }
  }, [])

  const setVelocity = useCallback((velocity: number) => {
    velocityRef.current = velocity
  }, [])

  const updateVelocity = useCallback((nextVelocity: number) => {
    velocityRef.current = velocityRef.current * 0.35 + nextVelocity * 0.65
  }, [])

  const start = useCallback(() => {
    const metrics = measure()

    if (!metrics || !canStartRef.current) {
      return
    }

    let velocity = velocityRef.current

    if (Math.abs(velocity) < MOMENTUM_STOP_THRESHOLD) {
      velocityRef.current = 0
      return
    }

    stop()
    let lastFrameTime = performance.now()

    const continueMomentum = (currentFrameTime: number) => {
      const nextMetrics = measure()

      if (!nextMetrics) {
        frameRef.current = null
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
        frameRef.current = null
        velocityRef.current = 0
        return
      }

      velocityRef.current = velocity
      frameRef.current = window.requestAnimationFrame(continueMomentum)
    }

    frameRef.current = window.requestAnimationFrame(continueMomentum)
  }, [canStartRef, measure, stop])

  useEffect(() => stop, [stop])

  return {
    setVelocity,
    start,
    stop,
    updateVelocity,
  }
}
