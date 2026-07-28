import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartFreeShippingPromotion } from '@/lib/cart/model/cart'
import { formatMoney } from '@/lib/money/format-money'

const AUTOPLAY_INTERVAL_MS = 5000
// Responsive height changes and reduced motion can skip transitionend.
const LOOP_RESET_FALLBACK_MS = 800

export function AnnouncementBanner({
  freeShippingPromotion,
}: {
  freeShippingPromotion: CartFreeShippingPromotion | null
}) {
  const { market, t } = useMarket()
  const messages = useMemo(() => {
    const newArrivalsMessage = t('header.announcementNewArrivals')

    if (!freeShippingPromotion) {
      return [newArrivalsMessage]
    }

    const threshold = formatMoney(
      freeShippingPromotion.threshold,
      market.locale,
    )

    return [
      t('header.announcementFreeShipping').replace('{amount}', threshold),
      newArrivalsMessage,
    ]
  }, [freeShippingPromotion, market.locale, t])
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
    setIsTransitionEnabled(true)
  }, [messages.length])

  useEffect(() => {
    if (messages.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => currentIndex + 1)
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [messages.length])

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

  return (
    <div
      aria-label={t('header.announcementLabel')}
      aria-roledescription="carousel"
      className="relative h-10 overflow-hidden bg-foreground text-background lg:h-8"
      role="group"
    >
      <div className="relative flex h-full items-center justify-center px-12 sm:px-16">
        <div className="relative h-full w-full overflow-hidden">
          <div
            className={
              isTransitionEnabled
                ? 'flex flex-col transform-gpu transition-transform duration-700 ease-out will-change-transform motion-reduce:transition-none'
                : 'flex flex-col transform-gpu will-change-transform'
            }
            onTransitionCancel={handleLoopTransition}
            onTransitionEnd={handleLoopTransition}
            style={{
              transform: `translate3d(0, -${activeIndex * stepPercent}%, 0)`,
            }}
          >
            {renderedMessages.map((message, index) => (
              <p
                aria-hidden={
                  index % Math.max(messages.length, 1) !== visibleIndex
                }
                className="text-sm leading-4 font-normal uppercase flex h-10 shrink-0 items-center justify-center px-8 text-center lg:h-8"
                key={`announcement-${index + 1}`}
              >
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
