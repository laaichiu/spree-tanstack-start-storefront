// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProductListing, getProductSummaries } from './get-product-summaries'

const server = vi.hoisted(() => ({
  mapProducts: vi.fn(),
}))

const client = {
  products: {
    list: vi.fn(),
  },
}

vi.mock('../mappers/product.mapper', () => ({
  mapSpreeProductsToSummaries: server.mapProducts,
}))

function product(id: string) {
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
    product_id: 'prod_first',
    small_url: null,
    variant_ids: [],
    ...overrides,
  }
}

describe('catalog product listing response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.products.list.mockResolvedValue({
      data: [product('prod_first'), product('prod_second')],
      meta: {
        count: 2,
        from: 1,
        limit: 24,
        page: 1,
        pages: 1,
        to: 2,
      },
    })
    server.mapProducts.mockReturnValue([{ id: 'prod_first' }])
  })

  it('validates product resource identities before mapping summaries', async () => {
    await expect(getProductSummaries(client as never)).resolves.toEqual([
      { id: 'prod_first' },
    ])

    expect(server.mapProducts).toHaveBeenCalledWith([
      product('prod_first'),
      product('prod_second'),
    ])
  })

  it('requests the public seller projection for product summaries and listings', async () => {
    await getProductSummaries(client as never)
    await getProductListing(client as never)

    expect(client.products.list).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        expand: expect.arrayContaining(['seller']),
      }),
    )
    expect(client.products.list).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        expand: expect.arrayContaining(['seller']),
      }),
    )
  })

  it('fails closed before mapping a non-product list resource', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [product('variant_wrong')],
      meta: {},
    })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'not a product resource',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed list envelope', async () => {
    client.products.list.mockResolvedValueOnce({ data: null })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'catalog list response is malformed',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a nested variant from another product', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [
        {
          id: 'prod_first',
          variants: [{ id: 'variant_other', product_id: 'prod_other' }],
        },
      ],
      meta: {},
    })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'does not belong to the requested product',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a nested category from another resource', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [{ categories: [{ id: 'or_order' }], id: 'prod_first' }],
      meta: {},
    })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'not a category resource',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a product with an incomplete mapper shape', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [{ ...product('prod_first'), name: undefined }],
      meta: {},
    })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'catalog product response is malformed',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping media from another product', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [
        {
          ...product('prod_first'),
          primary_media: media({ product_id: 'prod_other' }),
        },
      ],
      meta: {},
    })

    await expect(getProductSummaries(client as never)).rejects.toThrow(
      'nested media does not belong to the requested product',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('validates product resource identities before returning listing metadata', async () => {
    await expect(getProductListing(client as never)).resolves.toEqual({
      meta: {
        count: 2,
        from: 1,
        limit: 24,
        page: 1,
        pages: 1,
        to: 2,
      },
      products: [{ id: 'prod_first' }],
    })
  })

  it('fails closed before returning listing metadata for a missing product id', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [product(undefined as never)],
      meta: {},
    })

    await expect(getProductListing(client as never)).rejects.toThrow(
      'not a product resource',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed listing pagination response', async () => {
    client.products.list.mockResolvedValueOnce({
      data: [product('prod_first')],
      meta: null,
    })

    await expect(getProductListing(client as never)).rejects.toThrow(
      'catalog pagination metadata is malformed',
    )
    expect(server.mapProducts).not.toHaveBeenCalled()
  })
})
