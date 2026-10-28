import { useCallback, useEffect } from 'react'

import type { ProductReviewMediaLightboxDisplay } from './review-media-lightbox-model'

export function useReviewMediaLightbox({
  items,
  onSelectId,
  selectedId,
}: {
  items: readonly ProductReviewMediaLightboxDisplay[]
  onSelectId: (id: string) => void
  selectedId: string | null
}) {
  const selectedIndex = items.findIndex((item) => item.id === selectedId)
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null
  const isOpen = Boolean(selectedItem)

  const selectPrevious = useCallback(() => {
    if (!selectedItem) {
      return
    }

    const previousIndex =
      selectedIndex > 0 ? selectedIndex - 1 : items.length - 1
    onSelectId(items[previousIndex].id)
  }, [items, onSelectId, selectedIndex, selectedItem])

  const selectNext = useCallback(() => {
    if (!selectedItem) {
      return
    }

    const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0
    onSelectId(items[nextIndex].id)
  }, [items, onSelectId, selectedIndex, selectedItem])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    // The standard modal lock preserves the scrollbar gutter; this full-screen
    // surface locks body scroll directly so it reaches the viewport edge.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!selectedItem) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        selectPrevious()
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        selectNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectNext, selectPrevious, selectedItem])

  return {
    isOpen,
    selectNext,
    selectPrevious,
    selectedIndex,
    selectedItem,
  }
}
