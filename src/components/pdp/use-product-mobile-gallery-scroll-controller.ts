import type { UIEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export function useProductMobileGalleryScrollController({
  imageCount,
  imagesKey,
  onSelectImage,
  selectedIndex,
}: {
  imageCount: number
  imagesKey: string
  onSelectImage: (index: number) => void
  selectedIndex: number
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(selectedIndex)
  const imagesKeyRef = useRef(imagesKey)
  const hasAlignedRef = useRef(false)

  useLayoutEffect(() => {
    const imagesChanged = imagesKeyRef.current !== imagesKey
    const selectionChanged = activeIndexRef.current !== selectedIndex
    const scroller = scrollerRef.current

    if (
      !scroller ||
      (!imagesChanged && !selectionChanged && hasAlignedRef.current)
    ) {
      return
    }

    imagesKeyRef.current = imagesKey
    activeIndexRef.current = selectedIndex
    hasAlignedRef.current = true
    scroller.scrollTo({
      behavior: 'auto',
      left: scroller.clientWidth * selectedIndex,
    })
  }, [imagesKey, selectedIndex])

  useEffect(() => {
    const scroller = scrollerRef.current

    if (!scroller || typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      scroller.scrollTo({
        behavior: 'auto',
        left: scroller.clientWidth * activeIndexRef.current,
      })
    })

    resizeObserver.observe(scroller)

    return () => resizeObserver.disconnect()
  }, [])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const nextIndex = getMobileGalleryIndex(
        event.currentTarget.scrollLeft,
        event.currentTarget.clientWidth,
        imageCount,
      )

      if (nextIndex === activeIndexRef.current) {
        return
      }

      activeIndexRef.current = nextIndex
      onSelectImage(nextIndex)
    },
    [imageCount, onSelectImage],
  )

  return {
    handleScroll,
    scrollerRef,
  }
}

function getMobileGalleryIndex(
  scrollLeft: number,
  viewportWidth: number,
  imageCount: number,
) {
  if (viewportWidth <= 0 || imageCount <= 1) {
    return 0
  }

  return Math.max(
    0,
    Math.min(imageCount - 1, Math.round(scrollLeft / viewportWidth)),
  )
}
