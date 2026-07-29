import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductImage } from '@/lib/catalog/model/product'
import type { MessageKey } from '@/lib/i18n/messages'

import { ProductDetailGallery } from './product-detail-gallery'
import { getMobileGalleryIndex } from './product-detail-mobile-gallery'

afterEach(cleanup)

const images = Array.from({ length: 3 }, (_, index) => ({
  alt: `Product view ${index + 1}`,
  id: `image-${index + 1}`,
  src: `/product-${index + 1}.jpg`,
  variantIds: [],
})) satisfies ProductImage[]

const translate = ((key: MessageKey) =>
  key === 'product.discount'
    ? '{percent}% OFF'
    : key === 'product.preorder'
      ? 'Pre-order'
      : key) as (key: MessageKey) => string

function GalleryHarness() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <ProductDetailGallery
      hasMultipleImages
      images={images}
      onSelectImage={setSelectedIndex}
      onZoom={() => undefined}
      productName="Test product"
      safeSelectedMediaIndex={selectedIndex}
      selectedImage={images[selectedIndex]}
      t={translate}
    />
  )
}

describe('ProductDetailGallery', () => {
  it('maps horizontal mobile scroll positions to bounded image indexes', () => {
    expect(getMobileGalleryIndex(0, 320, 3)).toBe(0)
    expect(getMobileGalleryIndex(319, 320, 3)).toBe(1)
    expect(getMobileGalleryIndex(640, 320, 3)).toBe(2)
    expect(getMobileGalleryIndex(999, 320, 3)).toBe(2)
    expect(getMobileGalleryIndex(-100, 320, 3)).toBe(0)
  })

  it('updates the mobile progress line when the gallery scrolls', () => {
    render(<GalleryHarness />)

    const scroller = screen.getByRole('group', {
      name: 'Test product: product.gallery',
    })

    Object.defineProperty(scroller, 'clientWidth', {
      configurable: true,
      value: 320,
    })
    Object.defineProperty(scroller, 'scrollLeft', {
      configurable: true,
      value: 320,
      writable: true,
    })

    fireEvent.scroll(scroller)

    expect(
      screen
        .getByRole('progressbar', {
          name: 'Test product: product.gallery 2 / 3',
        })
        .getAttribute('aria-valuenow'),
    ).toBe('2')
    expect(
      screen
        .getByRole('button', {
          name: 'Test product: product.gallery 2 / 3',
        })
        .getAttribute('aria-current'),
    ).toBe('true')
  })

  it('realigns the mobile gallery before displaying a new image set', () => {
    const view = render(
      <ProductDetailGallery
        hasMultipleImages
        images={images}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={2}
        selectedImage={images[2]}
        t={translate}
      />,
    )
    const scroller = screen.getByRole('group', {
      name: 'Test product: product.gallery',
    })
    const scrollTo = vi.fn()

    Object.defineProperty(scroller, 'clientWidth', {
      configurable: true,
      value: 320,
    })
    Object.defineProperty(scroller, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })

    const nextImages = images.map((image) => ({
      ...image,
      id: `next-${image.id}`,
    }))

    view.rerender(
      <ProductDetailGallery
        hasMultipleImages
        images={nextImages}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={nextImages[0]}
        t={translate}
      />,
    )

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0 })
  })

  it('reserves the same mobile progress space for single and multiple images', () => {
    const view = render(<GalleryHarness />)
    const multipleImageProgressSlot =
      screen.getByRole('progressbar').parentElement

    expect(multipleImageProgressSlot?.className).toContain('mt-3')
    expect(multipleImageProgressSlot?.className).toContain('h-0.5')

    view.rerender(
      <ProductDetailGallery
        hasMultipleImages={false}
        images={[images[0]]}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    const singleImageMobileGallery = view.container.querySelector(
      'section[aria-label="product.gallery"]',
    )?.firstElementChild
    const singleImageProgressSlot = singleImageMobileGallery?.lastElementChild

    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(singleImageProgressSlot?.className).toBe(
      multipleImageProgressSlot?.className,
    )
  })

  it('uses a zoom cursor without hover image animation for every gallery shape', () => {
    const view = render(<GalleryHarness />)

    expect(
      screen
        .getAllByRole('button')
        .every((button) => button.className.includes('cursor-zoom-in')),
    ).toBe(true)
    expect(
      screen
        .getAllByRole('img')
        .every(
          (image) =>
            !image.className.includes('scale') &&
            !image.className.includes('transition'),
        ),
    ).toBe(true)

    view.rerender(
      <ProductDetailGallery
        hasMultipleImages={false}
        images={[images[0]]}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    expect(
      screen
        .getAllByRole('button')
        .every((button) => button.className.includes('cursor-zoom-in')),
    ).toBe(true)
    expect(
      screen
        .getAllByRole('img')
        .every(
          (image) =>
            !image.className.includes('scale') &&
            !image.className.includes('transition'),
        ),
    ).toBe(true)
  })

  it('places the sale badge on the first image in both responsive gallery layouts', () => {
    render(
      <ProductDetailGallery
        discountPercent={40}
        hasMultipleImages
        images={images}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    expect(screen.getAllByLabelText('40% OFF')).toHaveLength(2)
  })

  it('places the preorder badge beside the sale badge on the first image', () => {
    render(
      <ProductDetailGallery
        discountPercent={40}
        hasMultipleImages
        images={images}
        isPreorder
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    expect(screen.getAllByLabelText('40% OFF')).toHaveLength(2)
    expect(screen.getAllByLabelText('Pre-order')).toHaveLength(2)
  })

  it('uses the preorder badge in the sale badge position when there is no sale', () => {
    const view = render(
      <ProductDetailGallery
        hasMultipleImages
        images={images}
        isPreorder
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    expect(screen.getAllByLabelText('Pre-order')).toHaveLength(2)
    expect(screen.queryByLabelText(/% OFF/)).toBeNull()

    view.rerender(
      <ProductDetailGallery
        hasMultipleImages
        images={images}
        onSelectImage={() => undefined}
        onZoom={() => undefined}
        productName="Test product"
        safeSelectedMediaIndex={0}
        selectedImage={images[0]}
        t={translate}
      />,
    )

    expect(screen.queryByLabelText('Pre-order')).toBeNull()
  })
})
