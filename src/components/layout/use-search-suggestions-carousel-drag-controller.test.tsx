import { act, cleanup, renderHook } from '@testing-library/react'
import type { RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSearchSuggestionsCarouselDragController } from './use-search-suggestions-carousel-drag-controller'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useSearchSuggestionsCarouselDragController', () => {
  it('cancels old momentum when the suggestion collection changes', () => {
    const element = document.createElement('ul')
    Object.defineProperties(element, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 300 },
    })
    const scrollerRef = {
      current: element,
    } satisfies RefObject<HTMLUListElement | null>
    const measure = vi.fn(() => ({
      element,
      maxScrollLeft: 200,
      pageCount: 3,
    }))
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const { result, rerender } = renderHook(
      ({ itemsKey }: { itemsKey: string }) =>
        useSearchSuggestionsCarouselDragController({
          isOpen: true,
          itemsKey,
          measure,
          scrollerRef,
        }),
      { initialProps: { itemsKey: 'product-a' } },
    )

    act(() => {
      result.current.onMouseDownCapture({
        button: 0,
        clientX: 100,
        currentTarget: element,
        preventDefault: () => undefined,
        timeStamp: 1,
      } as never)
      const moveEvent = new MouseEvent('mousemove', { clientX: 70 })
      Object.defineProperty(moveEvent, 'timeStamp', {
        configurable: true,
        value: 2,
      })
      window.dispatchEvent(moveEvent)
      window.dispatchEvent(new MouseEvent('mouseup'))
    })

    rerender({ itemsKey: 'product-b' })

    expect(cancelAnimationFrame).toHaveBeenCalled()
  })
})
