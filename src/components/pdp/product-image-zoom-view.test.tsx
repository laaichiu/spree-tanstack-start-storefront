import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductImageZoomView } from './product-image-zoom-view'

const originalScrollTo = Reflect.get(HTMLElement.prototype, 'scrollTo')

beforeEach(() => {
  Reflect.set(HTMLElement.prototype, 'scrollTo', vi.fn())
})

afterEach(() => {
  cleanup()

  if (typeof originalScrollTo === 'function') {
    Reflect.set(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  }
})

describe('ProductImageZoomView', () => {
  it('presents the selected image and close control', () => {
    render(
      <ProductImageZoomView
        actions={{ close: vi.fn(), selectImage: vi.fn() }}
        copy={{
          closeImagePreview: 'Close preview',
          imagePreview: 'Image preview',
          nextImage: 'Next image',
          previousImage: 'Previous image',
        }}
        model={{
          images: [
            {
              alt: 'Linen shirt',
              id: 'image-1',
              src: '/images/linen-shirt.jpg',
              srcSet: '/images/linen-shirt.jpg 1x',
            },
          ],
          selectedIndex: 0,
        }}
      />,
    )

    expect(screen.getAllByRole('img', { name: 'Linen shirt' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Close preview' })).toBeTruthy()
  })
})
