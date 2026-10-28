import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductGalleryImageButtonView } from './product-gallery-image-button-view'
import type { ProductGalleryImageDisplay } from './product-gallery-model'

afterEach(cleanup)

const image = {
  alt: 'Front view',
  id: 'image-1',
  src: '/front.jpg',
  srcSet: '/front.jpg 1x',
} satisfies ProductGalleryImageDisplay

describe('ProductGalleryImageButtonView', () => {
  it('delegates zoom for an available image', () => {
    const onZoom = vi.fn()
    render(
      <ProductGalleryImageButtonView
        image={image}
        label="Product gallery"
        onZoom={onZoom}
        sizes="100vw"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Product gallery' }))
    expect(onZoom).toHaveBeenCalledOnce()
  })

  it('disables zoom when no image is available', () => {
    const onZoom = vi.fn()
    render(
      <ProductGalleryImageButtonView
        image={null}
        imageComingSoon="Image coming soon"
        label="Product gallery"
        onZoom={onZoom}
        sizes="100vw"
      />,
    )

    const button = screen.getByRole('button', { name: 'Product gallery' })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(onZoom).not.toHaveBeenCalled()
  })

  it('renders an optional overlay directly', () => {
    render(
      <ProductGalleryImageButtonView
        image={image}
        label="Product gallery"
        onZoom={vi.fn()}
        overlay={<span>New arrival</span>}
        sizes="100vw"
      />,
    )

    expect(screen.getByText('New arrival')).toBeTruthy()
  })
})
