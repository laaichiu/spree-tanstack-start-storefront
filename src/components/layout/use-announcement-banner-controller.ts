import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const AUTOPLAY_INTERVAL_MS = 5000
// Responsive height changes and reduced motion can skip transitionend.
const LOOP_RESET_FALLBACK_MS = 800

export function useAnnouncementBannerController(messages: readonly string[]) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const messagesKey = JSON.stringify(messages)
  const renderedMessages = useMemo(
    () => (messages.length <= 1 ? messages : [...messages, messages[0]]),
    [messages],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)
  const resetFrameRef = useRef<number | null>(null)
  const visibleIndex = messages.length > 0 ? activeIndex % messages.length : 0
  const stepPercent =
    renderedMessages.length > 0 ? 100 / renderedMessages.length : 0

  const resetLoop = useCallback(() => {
    setIsTransitionEnabled(false)
    setActiveIndex(0)

    if (resetFrameRef.current !== null) {
      cancelAnimationFrame(resetFrameRef.current)
    }

    resetFrameRef.current = requestAnimationFrame(() => {
      resetFrameRef.current = requestAnimationFrame(() => {
        setIsTransitionEnabled(true)
        resetFrameRef.current = null
      })
    })
  }, [])

  const handleLoopTransition = useCallback(() => {
    if (messages.length <= 1 || activeIndex !== messages.length) {
      return
    }

    resetLoop()
  }, [activeIndex, messages.length, resetLoop])

  useEffect(() => {
    if (resetFrameRef.current !== null) {
      cancelAnimationFrame(resetFrameRef.current)
      resetFrameRef.current = null
    }

    setActiveIndex(0)
    setIsTransitionEnabled(prefersReducedMotion !== true)
  }, [messages.length, messagesKey, prefersReducedMotion])

  useEffect(() => {
    if (messages.length < 2 || prefersReducedMotion !== false) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => currentIndex + 1)
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [messages.length, prefersReducedMotion])

  useEffect(() => {
    if (messages.length <= 1 || activeIndex !== messages.length) {
      return
    }

    const timeoutId = window.setTimeout(resetLoop, LOOP_RESET_FALLBACK_MS)

    return () => window.clearTimeout(timeoutId)
  }, [activeIndex, messages.length, resetLoop])

  useEffect(() => {
    return () => {
      if (resetFrameRef.current !== null) {
        cancelAnimationFrame(resetFrameRef.current)
      }
    }
  }, [])

  return {
    activeIndex,
    handleLoopTransition,
    isTransitionEnabled,
    renderedMessages,
    stepPercent,
    visibleIndex,
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<
    boolean | null
  >(null)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setPrefersReducedMotion(false)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}
