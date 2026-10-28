import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductGalleryView } from './product-gallery-view'
import type { ProductGalleryModel } from './product-gallery-model'

afterEach(cleanup)

const model = {
  hasMultipleImages: false,
  images: [
    {
      alt: 'Front view',
      id: 'image-1',
      src: '/front.jpg',
      srcSet: '/front.jpg 1x',
    },
  ],
  productName: 'Cotton shirt',
  safeSelectedMediaIndex: 0,
  selectedImage: {
    alt: 'Front view',
    id: 'image-1',
    src: '/front.jpg',
    srcSet: '/front.jpg 1x',
  },
} satisfies ProductGalleryModel

describe('ProductGalleryView', () => {
  it('renders the badge overlay in the gallery image compositions', () => {
    render(
      <ProductGalleryView
        actions={{ openZoom: vi.fn(), selectImage: vi.fn() }}
        badgeOverlay={<span>Sale</span>}
        copy={{
          galleryLabel: 'Product gallery',
          imageComingSoon: 'Image coming soon',
        }}
        model={model}
      />,
    )

    expect(screen.getAllByText('Sale')).toHaveLength(2)
  })
})
