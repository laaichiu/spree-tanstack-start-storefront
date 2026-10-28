import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useProductDetail } from './use-product-detail'

describe('useProductDetail', () => {
  it('commits a safe image selection when the gallery shrinks', () => {
    const { result, rerender } = renderHook(
      ({ galleryImageCount }: { galleryImageCount: number }) =>
        useProductDetail({
          galleryImageCount,
          galleryImagesKey: 'image-a\u0000image-b\u0000image-c',
          resetDisclosureKey: 'product-1',
          resetGalleryKey: 'variant-1',
        }),
      { initialProps: { galleryImageCount: 3 } },
    )

    act(() => {
      result.current.actions.selectImage(2)
      result.current.actions.openZoom()
    })

    rerender({ galleryImageCount: 1 })

    expect(result.current.state.selectedImageIndex).toBe(0)
    expect(result.current.state.isZoomed).toBe(true)

    rerender({ galleryImageCount: 0 })

    expect(result.current.state.selectedImageIndex).toBe(0)
    expect(result.current.state.isZoomed).toBe(false)

    rerender({ galleryImageCount: 3 })

    expect(result.current.state.selectedImageIndex).toBe(0)
    expect(result.current.state.isZoomed).toBe(false)
  })

  it('resets disclosure state when the product identity changes', () => {
    const { result, rerender } = renderHook(
      ({ productId }: { productId: string }) =>
        useProductDetail({
          galleryImageCount: 2,
          galleryImagesKey: 'image-a\u0000image-b',
          resetDisclosureKey: productId,
          resetGalleryKey: 'variant-1',
        }),
      { initialProps: { productId: 'product-1' } },
    )

    act(() => {
      result.current.actions.toggleDisclosure('details')
    })

    expect(result.current.state.expandedDisclosureSection).toBe('details')

    rerender({ productId: 'product-2' })

    expect(result.current.state.expandedDisclosureSection).toBe('description')
  })

  it('resets the selected image when an equally sized gallery is replaced', () => {
    const { result, rerender } = renderHook(
      ({ galleryImagesKey }: { galleryImagesKey: string }) =>
        useProductDetail({
          galleryImageCount: 2,
          galleryImagesKey,
          resetDisclosureKey: 'product-1',
          resetGalleryKey: 'variant-1',
        }),
      { initialProps: { galleryImagesKey: 'image-a\u0000image-b' } },
    )

    act(() => {
      result.current.actions.selectImage(1)
      result.current.actions.openZoom()
    })

    rerender({ galleryImagesKey: 'image-c\u0000image-d' })

    expect(result.current.state.selectedImageIndex).toBe(0)
    expect(result.current.state.isZoomed).toBe(false)
  })

  it('resets the selected image when gallery order changes', () => {
    const { result, rerender } = renderHook(
      ({ galleryImagesKey }: { galleryImagesKey: string }) =>
        useProductDetail({
          galleryImageCount: 2,
          galleryImagesKey,
          resetDisclosureKey: 'product-1',
          resetGalleryKey: 'variant-1',
        }),
      { initialProps: { galleryImagesKey: 'image-a\u0000image-b' } },
    )

    act(() => {
      result.current.actions.selectImage(1)
    })

    rerender({ galleryImagesKey: 'image-b\u0000image-a' })

    expect(result.current.state.selectedImageIndex).toBe(0)
  })
})
