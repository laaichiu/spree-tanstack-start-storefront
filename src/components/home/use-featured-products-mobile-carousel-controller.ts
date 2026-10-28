import { useCallback, useEffect, useRef } from 'react'

export function useFeaturedProductsMobileCarouselController(itemsKey: string) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const indicatorThumbRef = useRef<HTMLDivElement | null>(null)

  const updateIndicator = useCallback(() => {
    const element = scrollerRef.current
    const indicator = indicatorRef.current
    const thumb = indicatorThumbRef.current

    if (!element || !indicator || !thumb) {
      return
    }

    const maxScroll = element.scrollWidth - element.clientWidth
    const hasOverflow = maxScroll > 4

    if (!hasOverflow) {
      indicator.style.opacity = '0'
      thumb.style.left = '0%'
      thumb.style.width = '100%'
      return
    }

    const progress = element.scrollLeft / maxScroll
    const thumbWidthPercent = Math.max(
      (element.clientWidth / element.scrollWidth) * 100,
      20,
    )

    indicator.style.opacity = '1'
    thumb.style.width = `${thumbWidthPercent}%`
    thumb.style.left = `${progress * (100 - thumbWidthPercent)}%`
  }, [])

  useEffect(() => {
    const element = scrollerRef.current

    if (!element) {
      return
    }

    element.scrollLeft = 0
    updateIndicator()

    element.addEventListener('scroll', updateIndicator, {
      passive: true,
    })
    window.addEventListener('resize', updateIndicator)

    return () => {
      element.removeEventListener('scroll', updateIndicator)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [itemsKey, updateIndicator])

  return {
    indicatorRef,
    indicatorThumbRef,
    scrollerRef,
  }
}
