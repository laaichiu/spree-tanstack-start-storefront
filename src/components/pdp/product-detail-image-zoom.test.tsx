import { useState } from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductImage } from '@/lib/catalog/model/product'
import type { MessageKey } from '@/lib/i18n/messages'

import { ProductDetailImageZoom } from './product-detail-image-zoom'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  vi.unstubAllGlobals()
})

const images = Array.from({ length: 3 }, (_, index) => ({
  alt: `Product view ${index + 1}`,
  id: `image-${index + 1}`,
  src: `/product-${index + 1}.jpg`,
  variantIds: [],
})) satisfies ProductImage[]

const translate = ((key: MessageKey) => key) as (key: MessageKey) => string

function ImageZoomHarness({
  galleryImages = images,
  initialSelectedIndex = 0,
  onClose = vi.fn(),
}: {
  galleryImages?: ProductImage[]
  initialSelectedIndex?: number
  onClose?: () => void
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)

  return (
    <ProductDetailImageZoom
      images={galleryImages}
      onClose={onClose}
      onSelectImage={setSelectedIndex}
      selectedIndex={selectedIndex}
      t={translate}
    />
  )
}

function ClosableImageZoomHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)} type="button">
        Open preview
      </button>
      {isOpen ? (
        <ProductDetailImageZoom
          images={images}
          onClose={() => setIsOpen(false)}
          onSelectImage={() => undefined}
          selectedIndex={0}
          t={translate}
        />
      ) : null}
    </>
  )
}

describe('ProductDetailImageZoom', () => {
  it('renders a swipeable mobile preview with a synced progress line', () => {
    render(<ImageZoomHarness />)

    const carousel = screen.getByRole('region', {
      name: 'product.imagePreview',
    })

    expect(
      screen.getAllByRole('group', { name: /Product view \d \d \/ 3/ }),
    ).toHaveLength(3)

    Object.defineProperty(carousel, 'clientWidth', {
      configurable: true,
      value: 320,
    })
    let scrollLeft = 320
    let programmaticScrolls = 0

    Object.defineProperty(carousel, 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => {
        programmaticScrolls += 1
        scrollLeft = value
      },
    })

    fireEvent.scroll(carousel)

    const progressBars = screen.getAllByRole('progressbar', {
      name: 'product.imagePreview: 2 / 3',
    })

    expect(
      progressBars.map((progress) => progress.getAttribute('aria-valuenow')),
    ).toEqual(['2', '2'])
    expect(
      progressBars.every((progress) => progress.className.includes('h-0.5')),
    ).toBe(true)
    expect(programmaticScrolls).toBe(0)
  })

  it('uses bounded desktop arrow controls without enabling image dragging', () => {
    render(<ImageZoomHarness />)

    expect(
      screen.queryByRole('button', { name: 'product.previousImage' }),
    ).toBeNull()

    const nextButton = screen.getByRole('button', {
      name: 'product.nextImage',
    })

    expect(nextButton.className).not.toContain('border')
    expect(nextButton.className).toContain('hover:bg-muted')
    fireEvent.click(nextButton)

    expect(
      screen.getByRole('button', { name: 'product.previousImage' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'product.nextImage' }))

    expect(
      screen.queryByRole('button', { name: 'product.nextImage' }),
    ).toBeNull()
    expect(
      screen
        .getAllByAltText('Product view 3')
        .at(-1)
        ?.getAttribute('draggable'),
    ).toBe('false')
  })

  it('handles bounded arrow keys from controls inside the dialog', () => {
    render(<ImageZoomHarness />)

    const closeButton = screen.getByRole('button', {
      name: 'product.closeImagePreview',
    })

    fireEvent.keyDown(closeButton, { key: 'ArrowLeft' })
    expect(
      screen.getAllByRole('progressbar', {
        name: 'product.imagePreview: 1 / 3',
      }),
    ).toHaveLength(2)

    fireEvent.keyDown(closeButton, { key: 'ArrowRight' })
    expect(
      screen.getAllByRole('progressbar', {
        name: 'product.imagePreview: 2 / 3',
      }),
    ).toHaveLength(2)

    fireEvent.keyDown(closeButton, { key: 'ArrowLeft' })
    expect(
      screen.getAllByRole('progressbar', {
        name: 'product.imagePreview: 1 / 3',
      }),
    ).toHaveLength(2)
  })

  it('aligns a mobile preview that opens at a non-zero image index', () => {
    const clientWidth = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(320)

    render(<ImageZoomHarness initialSelectedIndex={2} />)

    expect(
      screen.getByRole('region', { name: 'product.imagePreview' }).scrollLeft,
    ).toBe(640)

    clientWidth.mockRestore()
  })

  it('keeps the selected mobile image aligned after the viewport resizes', () => {
    let resizeCallback: ResizeObserverCallback | undefined

    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }

      disconnect() {}
      observe() {}
      unobserve() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    render(<ImageZoomHarness />)

    const carousel = screen.getByRole('region', {
      name: 'product.imagePreview',
    })

    Object.defineProperty(carousel, 'clientWidth', {
      configurable: true,
      value: 320,
    })
    Object.defineProperty(carousel, 'scrollLeft', {
      configurable: true,
      value: 640,
      writable: true,
    })
    fireEvent.scroll(carousel)

    Object.defineProperty(carousel, 'clientWidth', {
      configurable: true,
      value: 480,
    })
    act(() => resizeCallback?.([], {} as ResizeObserver))

    expect(carousel.scrollLeft).toBe(960)
  })

  it('keeps the same desktop image position with or without progress', () => {
    const { unmount } = render(<ImageZoomHarness galleryImages={[images[0]]} />)
    const singleImageFigure = screen
      .getAllByAltText('Product view 1')
      .at(-1)
      ?.closest('figure')
    const singleImageProgressSlot = singleImageFigure?.lastElementChild

    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(singleImageProgressSlot?.className).toContain('h-0.5')
    expect(singleImageProgressSlot?.className).toContain('w-72')

    unmount()
    render(<ImageZoomHarness />)

    const multipleImageFigure = screen
      .getAllByAltText('Product view 1')
      .at(-1)
      ?.closest('figure')
    const multipleImageProgressSlot = multipleImageFigure?.lastElementChild

    expect(multipleImageProgressSlot?.className).toBe(
      singleImageProgressSlot?.className,
    )
    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  it('closes from the dialog control', () => {
    const onClose = vi.fn()

    render(<ImageZoomHarness onClose={onClose} />)

    fireEvent.click(screen.getByRole('dialog'))
    fireEvent.click(screen.getByRole('group', { name: 'Product view 1 1 / 3' }))
    fireEvent.mouseDown(document.body)
    fireEvent.click(document.body)

    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', { name: 'product.closeImagePreview' }),
    )

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes with Escape and returns focus to the opener', async () => {
    render(<ClosableImageZoomHarness />)

    const openButton = screen.getByRole('button', { name: 'Open preview' })

    openButton.focus()
    fireEvent.click(openButton)

    const closeButton = await screen.findByRole('button', {
      name: 'product.closeImagePreview',
    })

    await waitFor(() => expect(document.activeElement).toBe(closeButton))
    fireEvent.keyDown(closeButton, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(openButton))
  })

  it('locks body scrolling without animating the full-screen surface', () => {
    document.body.style.overflow = 'auto'

    const { unmount } = render(<ImageZoomHarness />)
    const dialog = screen.getByRole('dialog')

    expect(document.body.style.overflow).toBe('hidden')
    expect(dialog.className).toContain('transition-none')
    expect(dialog.className).toContain('data-[starting-style]:scale-100')
    expect(dialog.className).toContain('data-[starting-style]:opacity-100')
    expect(dialog.className).toContain('data-[ending-style]:scale-100')
    expect(dialog.className).toContain('data-[ending-style]:opacity-100')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
  })
})
