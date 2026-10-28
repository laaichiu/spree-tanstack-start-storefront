import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ProductPageView } from './product-page-view'

afterEach(cleanup)

describe('ProductPageView', () => {
  it('keeps breadcrumbs above the gallery and the mobile heading below it', () => {
    const { container } = render(
      <ProductPageView
        labels={{
          discount: (percent) => `${percent}% off`,
          imageFallback: 'Image unavailable',
          outOfStock: 'Out of stock',
          preorder: 'Pre-order',
          relatedProductsTitle: 'You may also like',
        }}
        locale="en"
        marketParams={{ country: 'us', locale: 'en' }}
        relatedProducts={[]}
        slots={{
          breadcrumbs: <div data-testid="breadcrumbs">Breadcrumbs</div>,
          desktopHeading: <div data-testid="desktop-heading">Heading</div>,
          gallery: <div data-testid="gallery">Gallery</div>,
          mobileHeading: <div data-testid="mobile-heading">Heading</div>,
          purchase: <div data-testid="purchase">Purchase</div>,
          reviews: <div data-testid="reviews">Reviews</div>,
        }}
      />,
    )

    const article = container.querySelector('article')
    const order = Array.from(
      article?.querySelectorAll('[data-testid]') ?? [],
    ).map((element) => element.getAttribute('data-testid'))

    expect(order.slice(0, 5)).toEqual([
      'breadcrumbs',
      'gallery',
      'mobile-heading',
      'desktop-heading',
      'purchase',
    ])

    expect(article?.firstElementChild?.className).toContain('gap-y-5')
    expect(
      container.querySelector('[data-testid="desktop-heading"]')?.parentElement
        ?.className,
    ).toContain('pb-3')
    expect(
      container.querySelector('[data-testid="purchase"]')?.parentElement
        ?.className,
    ).toContain('lg:space-y-5')
  })
})
