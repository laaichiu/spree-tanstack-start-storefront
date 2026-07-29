// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import type { CategorySummary } from '../model/category'
import type { ProductSummary } from '../model/product'
import { loadHomePage } from './get-home-page'

type HomePageLoaders = NonNullable<Parameters<typeof loadHomePage>[1]>

const input = {
  market: {
    country: 'us',
    locale: 'en',
  },
}

const product: ProductSummary = {
  description: 'A useful mug.',
  id: 'product-mug',
  image: null,
  inStock: true,
  preorder: false,
  name: 'Everyday Mug',
  price: { amount: 12, currencyCode: 'USD' },
  slug: 'everyday-mug',
}

const category: CategorySummary = {
  id: 'category-kitchen',
  imageUrl: null,
  name: 'Kitchen',
  permalink: 'kitchen',
}

function createLoaders(
  overrides: Partial<HomePageLoaders> = {},
): HomePageLoaders {
  return {
    loadFeaturedCategories: vi.fn(async () => [category]),
    loadFeaturedProducts: vi.fn(async () => [product]),
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

describe('loadHomePage', () => {
  it('loads independent catalog sections together into one page contract', async () => {
    const pendingProducts = deferred<ProductSummary[]>()
    const pendingCategories = deferred<CategorySummary[]>()
    const loaders = createLoaders({
      loadFeaturedCategories: vi.fn(() => pendingCategories.promise),
      loadFeaturedProducts: vi.fn(() => pendingProducts.promise),
    })

    const pagePromise = loadHomePage(input, loaders)

    expect(loaders.loadFeaturedProducts).toHaveBeenCalledWith(input)
    expect(loaders.loadFeaturedCategories).toHaveBeenCalledWith(input)

    pendingProducts.resolve([product])
    pendingCategories.resolve([category])

    const page = await pagePromise

    expect(page).toEqual({
      featuredCategories: { categories: [category], status: 'ready' },
      featuredProducts: { products: [product], status: 'ready' },
    })
    expect(JSON.parse(JSON.stringify(page))).toEqual(page)
  })

  it('distinguishes empty sections from independent request failures', async () => {
    const categoryError = new Error('Categories unavailable')
    const loaders = createLoaders({
      loadFeaturedCategories: vi.fn(async () => {
        throw categoryError
      }),
      loadFeaturedProducts: vi.fn(async () => []),
    })

    const page = await loadHomePage(input, loaders)

    expect(page).toEqual({
      featuredCategories: { categories: [], status: 'error' },
      featuredProducts: { products: [], status: 'empty' },
    })
    expect(loaders.reportError).toHaveBeenCalledWith({
      context: 'home.categories',
      error: categoryError,
    })
  })
})
