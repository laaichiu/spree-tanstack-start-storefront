import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useSearchSuggestionsCarouselPaginationController } from './use-search-suggestions-carousel-pagination-controller'

afterEach(cleanup)

describe('useSearchSuggestionsCarouselPaginationController', () => {
  it('resets and remeasures when the suggestion collection changes', async () => {
    const { result, rerender } = renderHook(
      ({ itemsKey }: { itemsKey: string }) =>
        useSearchSuggestionsCarouselPaginationController({
          enabled: true,
          itemsKey,
          isOpen: true,
        }),
      { initialProps: { itemsKey: 'us:en:product-a' } },
    )
    const element = document.createElement('ul')

    Object.defineProperties(element, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 300 },
    })

    act(() => {
      result.current.setScrollerRef(element)
    })

    await waitFor(() => expect(result.current.indicator.pageCount).toBe(3))

    element.scrollLeft = 100
    rerender({ itemsKey: 'us:en:product-b' })

    await waitFor(() => {
      expect(element.scrollLeft).toBe(0)
      expect(result.current.indicator.activePage).toBe(0)
      expect(result.current.indicator.progress).toBe(0)
    })
  })
})
