import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDetailController } from '@/components/pdp/product-detail-controller'
import type { ProductPageModel } from '@/lib/catalog/model/product-page'

const purchaseMocks = vi.hoisted(() => ({
  addToCart: vi.fn(async () => undefined),
  selectOption: vi.fn(),
}))

vi.mock('@/components/pdp/use-product-purchase', () => ({
  useProductPurchase: () => ({
    activeCompareAtPrice: undefined,
    activePrice: { amount: 12, currencyCode: 'USD' },
    activeSku: 'MUG-L',
    addSelectedVariantToCart: purchaseMocks.addToCart,
    availability: 'ready',
    canAddToCart: true,
    hasAddToCartError: false,
    isAddingToCart: false,
    selectedOptions: { 'option-size': 'value-large' },
    selectedVariant: {
      id: 'variant-large',
      inStock: true,
      optionValues: [],
      price: { amount: 12, currencyCode: 'USD' },
      sku: 'MUG-L',
    },
    selectOption: purchaseMocks.selectOption,
  }),
}))

const page = {
  product: {
    categoryBreadcrumbs: [],
    defaultVariantId: 'variant-large',
    description: '',
    descriptionHtml: '',
    id: 'product-mug',
    images: [
      {
        alt: 'Front',
        id: 'image-front',
        src: '/front.jpg',
        variantIds: ['variant-large'],
      },
      {
        alt: 'Side',
        id: 'image-side',
        src: '/side.jpg',
        variantIds: ['variant-large'],
      },
    ],
    inStock: true,
    metaDescription: '',
    name: 'Everyday Mug',
    options: [],
    price: { amount: 12, currencyCode: 'USD' },
    purchasable: true,
    slug: 'everyday-mug',
    specifications: [],
    variantCount: 1,
    variants: [],
  },
  relatedProducts: [],
  reviews: null,
} satisfies ProductPageModel

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProductDetailController', () => {
  it('coordinates gallery, option, zoom, and disclosure UI state', () => {
    render(
      <ProductDetailController page={page}>
        {({ disclosures, gallery, purchase }) => (
          <div>
            <output data-testid="selected-image">
              {gallery.selectedIndex}
            </output>
            <output data-testid="zoom-state">
              {gallery.isZoomed ? 'open' : 'closed'}
            </output>
            <output data-testid="disclosure-state">
              {disclosures.expandedSection ?? 'none'}
            </output>
            <button onClick={() => gallery.selectImage(1)} type="button">
              Select second image
            </button>
            <button
              onClick={() =>
                purchase.selectOption('option-size', 'value-large')
              }
              type="button"
            >
              Select product option
            </button>
            <button onClick={gallery.openZoom} type="button">
              Open zoom
            </button>
            <button onClick={gallery.closeZoom} type="button">
              Close zoom
            </button>
            <button onClick={() => disclosures.toggle('details')} type="button">
              Toggle details
            </button>
          </div>
        )}
      </ProductDetailController>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Select second image' }))
    expect(screen.getByTestId('selected-image').textContent).toBe('1')

    fireEvent.click(
      screen.getByRole('button', { name: 'Select product option' }),
    )
    expect(screen.getByTestId('selected-image').textContent).toBe('0')
    expect(purchaseMocks.selectOption).toHaveBeenCalledWith(
      'option-size',
      'value-large',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open zoom' }))
    expect(screen.getByTestId('zoom-state').textContent).toBe('open')
    fireEvent.click(screen.getByRole('button', { name: 'Close zoom' }))
    expect(screen.getByTestId('zoom-state').textContent).toBe('closed')

    fireEvent.click(screen.getByRole('button', { name: 'Toggle details' }))
    expect(screen.getByTestId('disclosure-state').textContent).toBe('details')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle details' }))
    expect(screen.getByTestId('disclosure-state').textContent).toBe('none')
  })
})
