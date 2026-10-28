import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDetail } from './product-detail'

const state = vi.hoisted(() => ({
  market: { country: 'us', locale: 'en' },
  page: {
    product: { id: 'prod_shirt', name: 'Linen shirt' },
    relatedProducts: [],
    reviews: null,
  },
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: state.market,
    t: (key: string) => key,
  }),
}))

vi.mock('@/components/pdp/product-detail-controller', () => ({
  ProductDetailController: ({
    children,
  }: {
    children: (controller: unknown) => ReactNode
    page: unknown
  }) => {
    const instance = useId()

    return (
      <div data-testid="product-controller-instance">
        {instance}
        {children({
          disclosures: { expandedSection: null, toggle: () => undefined },
          gallery: {
            closeZoom: () => undefined,
            images: [],
            isZoomed: false,
            openZoom: () => undefined,
            selectedIndex: 0,
            selectImage: () => undefined,
          },
          page: state.page,
          purchase: {
            activeCompareAtPrice: null,
            activeDiscountPercent: null,
            activePrice: null,
            activeSku: null,
            addSelectedVariantToCart: async () => undefined,
            availability: 'unavailable',
            canAddToCart: false,
            isAddingToCart: false,
            isPreorder: false,
            selectedOptions: {},
            selectedVariant: null,
          },
        })}
      </div>
    )
  },
}))

vi.mock('@/components/pdp/product-detail-heading', () => ({
  ProductDetailBreadcrumbs: () => null,
  ProductDetailHeading: () => null,
}))

vi.mock('@/components/pdp/product-gallery-section', () => ({
  ProductGallerySection: () => null,
}))

vi.mock('@/components/pdp/product-page-view', () => ({
  ProductPageView: ({ slots }: { slots: { reviews: ReactNode } }) => (
    <div data-testid="product-page-view">{slots.reviews}</div>
  ),
}))

vi.mock('@/components/pdp/product-purchase-section', () => ({
  ProductPurchaseSection: () => null,
}))

afterEach(() => {
  cleanup()
  state.market.country = 'us'
  state.market.locale = 'en'
})

describe('ProductDetail market ownership', () => {
  it('remounts the product controller when the market changes', () => {
    const { rerender } = render(<ProductDetail page={state.page as never} />)
    const initialInstance = screen.getByTestId(
      'product-controller-instance',
    ).textContent

    state.market.country = 'de'
    state.market.locale = 'de-DE'
    rerender(<ProductDetail page={state.page as never} />)

    expect(
      screen.getByTestId('product-controller-instance').textContent,
    ).not.toBe(initialInstance)
  })
})
