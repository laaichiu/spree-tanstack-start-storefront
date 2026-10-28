import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useFeaturedProductsMobileCarouselController } from './use-featured-products-mobile-carousel-controller'

afterEach(cleanup)

function CarouselHarness({ itemsKey }: { itemsKey: string }) {
  const { indicatorRef, indicatorThumbRef, scrollerRef } =
    useFeaturedProductsMobileCarouselController(itemsKey)

  return (
    <>
      <div
        data-testid="carousel-scroller"
        ref={(element) => {
          if (element) {
            Object.defineProperties(element, {
              clientWidth: { configurable: true, value: 100 },
              scrollWidth: { configurable: true, value: 300 },
            })
          }

          scrollerRef.current = element
        }}
      />
      <div data-testid="carousel-indicator" ref={indicatorRef} />
      <div data-testid="carousel-thumb" ref={indicatorThumbRef} />
    </>
  )
}

describe('useFeaturedProductsMobileCarouselController', () => {
  it('resets scroll position when the product collection changes', async () => {
    const { rerender } = render(
      <CarouselHarness itemsKey="product-a\u0000product-b" />,
    )
    const scroller = screen.getByTestId('carousel-scroller')
    const indicator = screen.getByTestId('carousel-indicator')

    await waitFor(() => expect(indicator.style.opacity).toBe('1'))

    scroller.scrollLeft = 100
    rerender(<CarouselHarness itemsKey="product-c\u0000product-d" />)

    await waitFor(() => expect(scroller.scrollLeft).toBe(0))
  })
})
