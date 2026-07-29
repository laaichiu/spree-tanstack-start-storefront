// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import type { Product, ProductSummary } from '../model/product'
import { loadProductPage } from './get-product-page'

type ProductPageLoaders = NonNullable<Parameters<typeof loadProductPage>[1]>

const input = {
  market: {
    country: 'us',
    locale: 'en',
  },
  slug: 'everyday-bowl',
}

const product: Product = {
  categoryBreadcrumbs: [
    {
      id: 'category-kitchen',
      name: 'Kitchen',
      permalink: 'kitchen',
    },
    {
      id: 'category-tableware',
      name: 'Tableware',
      permalink: 'kitchen/tableware',
    },
  ],
  defaultVariantId: 'variant-1',
  description: 'A useful bowl.',
  descriptionHtml: '<p>A useful bowl.</p>',
  id: 'product-1',
  images: [],
  inStock: true,
  metaTitle: null,
  metaDescription: 'An everyday stoneware bowl.',
  name: 'Everyday Bowl',
  options: [],
  price: { amount: 24, currencyCode: 'USD' },
  purchasable: true,
  preorder: false,
  preorderShipsAt: null,
  slug: 'everyday-bowl',
  specifications: [],
  variantCount: 1,
  variants: [
    {
      id: 'variant-1',
      inStock: true,
      preorder: false,
      preorderShipsAt: null,
      optionValues: [],
      price: { amount: 24, currencyCode: 'USD' },
      sku: 'BOWL-1',
    },
  ],
}

const relatedProduct: ProductSummary = {
  defaultVariantId: null,
  description: 'A matching plate.',
  id: 'product-2',
  image: null,
  inStock: true,
  preorder: false,
  name: 'Everyday Plate',
  price: { amount: 20, currencyCode: 'USD' },
  slug: 'everyday-plate',
  variants: [],
}

function createLoaders(
  overrides: Partial<ProductPageLoaders> = {},
): ProductPageLoaders {
  return {
    loadProduct: vi.fn(async () => product),
    loadRelatedProducts: vi.fn(async () => [relatedProduct]),
    loadReviews: vi.fn(async () => ({ status: 'unavailable' as const })),
    reportError: vi.fn(),
    ...overrides,
  }
}

function deferred<T>() {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return { promise, resolve: resolvePromise }
}

describe('loadProductPage', () => {
  it('starts product and review loading together and returns one serializable page model', async () => {
    const pendingProduct = deferred<Product>()
    const loaders = createLoaders({
      loadProduct: vi.fn(() => pendingProduct.promise),
    })

    const pagePromise = loadProductPage(input, loaders)

    expect(loaders.loadProduct).toHaveBeenCalledWith(input)
    expect(loaders.loadReviews).toHaveBeenCalledWith({
      market: input.market,
      productId: input.slug,
    })
    expect(loaders.loadRelatedProducts).not.toHaveBeenCalled()

    pendingProduct.resolve(product)
    const page = await pagePromise

    expect(loaders.loadRelatedProducts).toHaveBeenCalledWith({
      categoryId: 'category-tableware',
      currentProductId: product.id,
      market: input.market,
    })
    expect(page).toEqual({
      product,
      relatedProducts: [relatedProduct],
      reviews: { status: 'unavailable' },
    })
    expect(JSON.parse(JSON.stringify(page))).toEqual(page)
  })

  it('does not request related products without a category boundary', async () => {
    const loaders = createLoaders({
      loadProduct: vi.fn(async () => ({
        ...product,
        categoryBreadcrumbs: [],
      })),
    })

    const page = await loadProductPage(input, loaders)

    expect(loaders.loadRelatedProducts).not.toHaveBeenCalled()
    expect(page.relatedProducts).toEqual([])
  })

  it('keeps the product page available when related products fail', async () => {
    const error = new Error('Related products unavailable')
    const loaders = createLoaders({
      loadRelatedProducts: vi.fn(async () => {
        throw error
      }),
    })

    const page = await loadProductPage(input, loaders)

    expect(page.relatedProducts).toEqual([])
    expect(loaders.reportError).toHaveBeenCalledWith({
      context: 'products.detail.relatedProducts',
      error,
    })
  })

  it('propagates the primary product failure for route error mapping', async () => {
    const error = new Error('Product unavailable')
    const loaders = createLoaders({
      loadProduct: vi.fn(async () => {
        throw error
      }),
    })

    await expect(loadProductPage(input, loaders)).rejects.toBe(error)
    expect(loaders.loadReviews).toHaveBeenCalledOnce()
    expect(loaders.loadRelatedProducts).not.toHaveBeenCalled()
  })
})
