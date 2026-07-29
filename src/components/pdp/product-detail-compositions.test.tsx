import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { ProductDetailControllerValue } from '@/components/pdp/product-detail-controller'
import { ProductDetailEditorialView } from '@/components/pdp/product-detail-editorial-view'
import { ProductDetailReferenceView } from '@/components/pdp/product-detail-reference-view'
import type { ProductPageModel } from '@/lib/catalog/model/product-page'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    'aria-label': ariaLabel,
    children,
    className,
  }: {
    'aria-label'?: string
    children: ReactNode
    className?: string
  }) => (
    <a aria-label={ariaLabel} className={className} href="/fixture-link">
      {children}
    </a>
  ),
}))

const page = {
  product: {
    categoryBreadcrumbs: [],
    compareAtPrice: { amount: 16, currencyCode: 'USD' },
    defaultVariantId: 'variant-large',
    description: 'A useful mug for slow mornings.',
    descriptionHtml:
      '<p>A useful mug for <strong>slow mornings</strong>.</p><ul><li>Dishwasher safe</li></ul>',
    id: 'product-mug',
    images: [
      {
        alt: 'Everyday Mug in stone',
        id: 'image-mug',
        src: '/mug.jpg',
        variantIds: ['variant-large'],
      },
    ],
    inStock: true,
    metaTitle: null,
    metaDescription: 'A useful mug.',
    name: 'Everyday Mug',
    options: [
      {
        id: 'option-size',
        label: 'Size',
        name: 'size',
        values: [
          {
            colorCode: null,
            id: 'value-large',
            imageUrl: null,
            label: 'Large',
            name: 'large',
          },
        ],
      },
    ],
    price: { amount: 12, currencyCode: 'USD' },
    purchasable: true,
    preorder: false,
    preorderShipsAt: null,
    slug: 'everyday-mug',
    specifications: [{ label: 'Material', value: 'Stoneware' }],
    variantCount: 1,
    variants: [
      {
        compareAtPrice: { amount: 16, currencyCode: 'USD' },
        id: 'variant-large',
        inStock: true,
        preorder: false,
        preorderShipsAt: null,
        optionValues: [
          {
            colorCode: null,
            id: 'value-large',
            imageUrl: null,
            label: 'Large',
            name: 'large',
            optionTypeId: 'option-size',
            optionTypeLabel: 'Size',
            optionTypeName: 'size',
          },
        ],
        price: { amount: 12, currencyCode: 'USD' },
        sku: 'MUG-L',
      },
    ],
  },
  relatedProducts: [
    {
      defaultVariantId: null,
      description: 'A companion cup.',
      id: 'product-cup',
      image: null,
      inStock: true,
      preorder: false,
      name: 'Companion Cup',
      price: { amount: 8, currencyCode: 'USD' },
      slug: 'companion-cup',
      variants: [],
    },
  ],
  reviews: {
    filters: {
      defaultSort: 'most_recent',
      filters: [],
      sortOptions: ['most_recent'],
    },
    initialPage: {
      pagination: {
        count: 0,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 0,
        previousPage: null,
      },
      reviews: [],
    },
    status: 'ready',
    summary: {
      averageRating: 0,
      productId: 'product-mug',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviewCount: 0,
    },
  },
} satisfies ProductPageModel

function createController() {
  const addSelectedVariantToCart = vi.fn(async () => undefined)
  const controller: ProductDetailControllerValue = {
    disclosures: {
      expandedSection: 'description',
      toggle: vi.fn(),
    },
    gallery: {
      closeZoom: vi.fn(),
      hasMultipleImages: false,
      images: page.product.images,
      isZoomed: false,
      openZoom: vi.fn(),
      selectedImage: page.product.images[0],
      selectedIndex: 0,
      selectImage: vi.fn(),
    },
    page,
    purchase: {
      activeCompareAtPrice: page.product.compareAtPrice,
      activePrice: page.product.price,
      activeSku: 'MUG-L',
      addSelectedVariantToCart,
      availability: 'ready',
      canAddToCart: true,
      hasAddToCartError: false,
      isAddingToCart: false,
      isPreorder: false,
      selectedOptions: { 'option-size': 'value-large' },
      selectedVariant: page.product.variants[0],
      selectOption: vi.fn(),
    },
  }

  return { addSelectedVariantToCart, controller }
}

function renderComposition(
  View: ComponentType<{ controller: ProductDetailControllerValue }>,
) {
  const fixture = createController()

  render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <View controller={fixture.controller} />
    </MarketProvider>,
  )

  return fixture
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe.each([
  ['reference', ProductDetailReferenceView],
  ['editorial', ProductDetailEditorialView],
] as const)('%s product composition', (_name, View) => {
  it('renders the same normalized merchandising and commerce contract', async () => {
    const { addSelectedVariantToCart } = renderComposition(View)

    expect(
      screen.getAllByRole('heading', { level: 1, name: 'Everyday Mug' }).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0)
    expect(screen.getByText('slow mornings').tagName).toBe('STRONG')
    expect(screen.getByText('Dishwasher safe').tagName).toBe('LI')
    expect(screen.getByRole('button', { name: 'Large' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'View Companion Cup' }),
    ).toBeTruthy()
    expect(
      (await screen.findAllByText('No reviews yet')).length,
    ).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }))
    expect(addSelectedVariantToCart).toHaveBeenCalledOnce()
  })
})

it('keeps both compositions and their capabilities outside infrastructure boundaries', () => {
  const compositionFiles = [
    'product-detail.tsx',
    'product-detail-controller.tsx',
    'product-detail-editorial-view.tsx',
    'product-detail-reference-view.tsx',
    'product-gallery-section.tsx',
    'product-page-reviews.tsx',
    'product-purchase-section.tsx',
  ]
  const source = compositionFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')

  expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
  expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
  expect(source).not.toMatch(/\.server(?:'|")/)
  expect(source).not.toContain('product-detail-editorial-view')
})
