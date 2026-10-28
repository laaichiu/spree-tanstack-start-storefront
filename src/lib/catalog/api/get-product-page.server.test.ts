// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { loadProductPageForMarket } from './get-product-page.server'

const server = vi.hoisted(() => ({
  getProductDetailForMarket: vi.fn(),
  getProductReviewsOverviewForMarket: vi.fn(),
  getRelatedProductSummariesForMarket: vi.fn(),
}))

vi.mock('./get-product-detail.server', () => ({
  getProductDetailForMarket: server.getProductDetailForMarket,
}))

vi.mock('./get-related-product-summaries.server', () => ({
  getRelatedProductSummariesForMarket:
    server.getRelatedProductSummariesForMarket,
}))

vi.mock('@/lib/reviews/api/product-reviews-overview.server', () => ({
  getProductReviewsOverviewForMarket: server.getProductReviewsOverviewForMarket,
}))

const market = {
  country: 'de',
  countryName: 'Germany',
  currencyCode: 'EUR',
  currencyLabel: 'Euro',
  locale: 'de-DE',
  localeLabel: 'Deutsch',
  localeShortLabel: 'DE',
  marketId: 'market_de',
  marketName: 'Germany',
}

describe('catalog product page request market scope', () => {
  it('passes one verified market to product, related products, and reviews', async () => {
    const product = {
      categoryBreadcrumbs: [{ id: 'ctg_shirts' }],
      id: 'prod_de_shirt',
    } as never
    const reviews = { status: 'unavailable' } as const
    const relatedProducts = [{ id: 'prod_de_related' }] as never
    server.getProductDetailForMarket.mockResolvedValue(product)
    server.getProductReviewsOverviewForMarket.mockResolvedValue(reviews)
    server.getRelatedProductSummariesForMarket.mockResolvedValue(
      relatedProducts,
    )

    await expect(
      loadProductPageForMarket({ market, slug: 'summer-shirt' }),
    ).resolves.toEqual({
      product,
      relatedProducts,
      reviews,
    })

    expect(server.getProductDetailForMarket).toHaveBeenCalledWith({
      market,
      slug: 'summer-shirt',
    })
    expect(server.getRelatedProductSummariesForMarket).toHaveBeenCalledWith({
      categoryId: 'ctg_shirts',
      currentProductId: 'prod_de_shirt',
      market,
    })
    expect(server.getProductReviewsOverviewForMarket).toHaveBeenCalledWith({
      market,
      productId: 'prod_de_shirt',
    })
  })
})
