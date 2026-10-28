// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProductDetailForMarket } from './get-product-detail.server'
import { categoryResource } from '../utils/catalog-category-response.test-support'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapProduct: vi.fn(),
}))

const client = {
  categories: {
    get: vi.fn(),
  },
  products: {
    get: vi.fn(),
  },
}

vi.mock('@/lib/catalog/mappers/product.mapper', () => ({
  mapSpreeProductToProduct: server.mapProduct,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

const market = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'USD',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_us',
  marketName: 'United States',
}

function productResource(id: string) {
  return {
    backorderable: false,
    default_variant_id: null,
    description: null,
    description_html: null,
    id,
    in_stock: true,
    meta_description: null,
    meta_title: null,
    name: 'Product',
    original_price: null,
    preorder: false,
    preorder_ships_at: null,
    price: {
      amount: null,
      compare_at_amount: null,
      amount_in_cents: null,
      compare_at_amount_in_cents: null,
      currency: 'USD',
    },
    purchasable: true,
    slug: 'product',
    thumbnail_url: null,
    variant_count: 0,
  }
}

function media(overrides: Record<string, unknown> = {}) {
  return {
    alt: null,
    id: 'media_product',
    large_url: null,
    medium_url: null,
    mini_url: null,
    original_url: null,
    product_id: 'prod_requested',
    small_url: null,
    variant_ids: [],
    ...overrides,
  }
}

describe('catalog product detail response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    client.products.get.mockResolvedValue(productResource('prod_requested'))
    server.mapProduct.mockReturnValue({ id: 'prod_requested' })
  })

  it('maps a response whose id matches a prefixed product lookup', async () => {
    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(client.products.get).toHaveBeenCalledWith('prod_requested', {
      expand: expect.arrayContaining(['seller']),
    })

    expect(server.mapProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod_requested' }),
    )
  })

  it('fails closed before hydration or mapping when a prefixed lookup returns another product', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_requested'),
      categories: [],
      id: 'prod_other',
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).rejects.toThrow('does not match the requested product')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })

  it('fails closed before hydration or mapping when a slug lookup returns another resource', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_requested'),
      categories: [],
      id: 'or_order',
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'summer-shirt' }),
    ).rejects.toThrow('not a product resource')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })

  it('fails closed before hydration or mapping when a nested variant belongs to another product', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_requested'),
      categories: [],
      id: 'prod_requested',
      variants: [
        {
          id: 'variant_other',
          product_id: 'prod_other',
        },
      ],
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).rejects.toThrow('does not belong to the requested product')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })

  it('fails closed before hydration or mapping when a nested category is another resource', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_requested'),
      categories: [{ id: 'or_order' }],
      id: 'prod_requested',
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).rejects.toThrow('not a category resource')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })

  it('fails closed before hydration or mapping when nested media belongs to another product', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_requested'),
      id: 'prod_requested',
      primary_media: media({ product_id: 'prod_other' }),
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).rejects.toThrow('nested media does not belong to the requested product')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })

  it('keeps permalink lookups compatible with locale fallback responses', async () => {
    client.products.get.mockResolvedValue({
      ...productResource('prod_localized'),
      categories: [],
      id: 'prod_localized',
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'summer-shirt' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(server.mapProduct).toHaveBeenCalled()
  })

  it('hydrates the deepest parent-owned category when root flags disagree', async () => {
    const shallowCategory = categoryResource({
      depth: 1,
      id: 'ctg_shallow',
      is_root: false,
      name: 'Shallow category',
      parent_id: 'ctg_root',
      permalink: 'root/shallow',
    })
    const deepCategory = categoryResource({
      depth: 2,
      id: 'ctg_deep',
      is_root: true,
      name: 'Deep category',
      parent_id: 'ctg_shallow',
      permalink: 'root/shallow/deep',
    })
    const product = {
      ...productResource('prod_requested'),
      categories: [deepCategory, shallowCategory],
      id: 'prod_requested',
    }
    client.products.get.mockResolvedValue(product)
    client.categories.get.mockImplementation(async (slug: string) => {
      if (slug === deepCategory.permalink) {
        return deepCategory
      }

      return shallowCategory
    })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(client.categories.get).toHaveBeenCalledWith(deepCategory.permalink, {
      expand: ['ancestors'],
    })
  })

  it('does not rehydrate a category whose ancestors are already expanded', async () => {
    const rootCategory = categoryResource({
      id: 'ctg_root',
      name: 'Root category',
      parent_id: null,
      permalink: 'root',
    })
    const childCategory = categoryResource({
      ancestors: [rootCategory],
      depth: 1,
      id: 'ctg_child',
      parent_id: 'ctg_root',
      permalink: 'root/child',
    })
    const product = {
      ...productResource('prod_requested'),
      categories: [childCategory],
      id: 'prod_requested',
    }
    client.products.get.mockResolvedValue(product)

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(client.categories.get).not.toHaveBeenCalled()
  })

  it('keeps the original category when breadcrumb hydration returns another category', async () => {
    const originalCategory = categoryResource({
      ancestors: [],
      id: 'ctg_requested',
      is_root: false,
      name: 'Original category',
      permalink: 'original-category',
    })
    const hydratedCategory = {
      ...originalCategory,
      id: 'ctg_other',
      name: 'Other category',
    }
    const product = {
      ...productResource('prod_requested'),
      categories: [originalCategory],
      id: 'prod_requested',
    }
    client.products.get.mockResolvedValue(product)
    client.categories.get.mockResolvedValue(hydratedCategory)

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(server.mapProduct).toHaveBeenCalledWith(product)
  })

  it('ignores a malformed optional breadcrumb response without mapping it', async () => {
    const category = categoryResource({
      ancestors: [],
      id: 'ctg_requested',
      is_root: false,
      name: 'Original category',
      permalink: 'original-category',
    })
    const product = {
      ...productResource('prod_requested'),
      categories: [category],
      id: 'prod_requested',
    }
    client.products.get.mockResolvedValue(product)
    client.categories.get.mockResolvedValue({ id: 'or_order' })

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).resolves.toEqual({ id: 'prod_requested' })

    expect(server.mapProduct).toHaveBeenCalledWith(product)
  })

  it('fails closed before breadcrumb hydration when a nested category is malformed', async () => {
    const product = {
      ...productResource('prod_requested'),
      categories: [categoryResource({ name: undefined })],
      id: 'prod_requested',
    }
    client.products.get.mockResolvedValue(product)

    await expect(
      getProductDetailForMarket({ market, slug: 'prod_requested' }),
    ).rejects.toThrow('catalog category response is malformed')

    expect(client.categories.get).not.toHaveBeenCalled()
    expect(server.mapProduct).not.toHaveBeenCalled()
  })
})
