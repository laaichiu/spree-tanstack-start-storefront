import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useProductMobileGalleryScrollController } from './use-product-mobile-gallery-scroll-controller'

afterEach(cleanup)

describe('useProductMobileGalleryScrollController', () => {
  it('realigns when the image collection changes at the same selected index', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'clientWidth', {
      configurable: true,
      value: 100,
    })
    const scrollTo = vi.fn()
    element.scrollTo = scrollTo

    const onSelectImage = vi.fn()
    const { result, rerender } = renderHook(
      ({ imagesKey }: { imagesKey: string }) =>
        useProductMobileGalleryScrollController({
          imageCount: 2,
          imagesKey,
          onSelectImage,
          selectedIndex: 1,
        }),
      { initialProps: { imagesKey: 'image-a\u0000image-b' } },
    )

    act(() => {
      result.current.scrollerRef.current = element
    })
    element.scrollLeft = 0

    rerender({ imagesKey: 'image-c\u0000image-d' })

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 100 })
  })
})
