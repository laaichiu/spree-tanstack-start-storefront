// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getReviewsFeatureEnabledSafely,
  getProductReviewsOverview,
  getProductReviewsPage,
  getProductReviewMediaGallery,
} from './product-reviews.functions'

const server = vi.hoisted(() => ({
  mapPage: vi.fn(),
  resolveReviewsRequestContext: vi.fn(),
  reportError: vi.fn(),
  isReviewsFeatureEnabled: vi.fn(),
}))

const client = {
  request: vi.fn(),
}

const market = {
  country: 'de',
  currencyCode: 'EUR',
  locale: 'de-DE',
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let inputValidator: unknown
    const builder = {
      handler:
        (handler: unknown) =>
        (options: { data?: unknown } = {}) => {
          const validatedData =
            typeof inputValidator === 'function'
              ? (inputValidator as (data: unknown) => unknown)(options.data)
              : options.data

          return (handler as (options: { data: unknown }) => unknown)({
            data: validatedData,
          })
        },
      validator: (validator: unknown) => {
        inputValidator = validator
        return builder
      },
    }

    return builder
  },
}))

vi.mock('../config/reviews-config.server', () => ({
  isReviewsFeatureEnabled: server.isReviewsFeatureEnabled,
}))

vi.mock('./reviews-request.server', () => ({
  productReviewsPath: (productId: string, suffix = '') =>
    `/products/${encodeURIComponent(productId)}/reviews${suffix}`,
  resolveReviewsRequestContext: server.resolveReviewsRequestContext,
}))

vi.mock('@/lib/observability/report-error', () => ({
  reportError: server.reportError,
}))

vi.mock('../mappers/product-review.mapper', () => ({
  mapProductReviewFilters: vi.fn(),
  mapProductReviewSummary: vi.fn(),
  mapProductReviewsPage: server.mapPage,
}))

const query = {
  answerFilters: {},
  page: 1,
  ratings: [],
  sort: 'most_recent' as const,
  verifiedPurchase: false,
  withImages: false,
}

describe('product review response ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.isReviewsFeatureEnabled.mockReturnValue(true)
    server.resolveReviewsRequestContext.mockResolvedValue({
      client,
      market,
    })
  })

  it('returns the configured feature state through a client-safe boundary', async () => {
    await expect(getReviewsFeatureEnabledSafely()).resolves.toBe(true)
  })

  it('fails closed when the feature status boundary fails', async () => {
    server.isReviewsFeatureEnabled.mockImplementation(() => {
      throw new Error('feature status unavailable')
    })

    await expect(getReviewsFeatureEnabledSafely()).resolves.toBe(false)
  })

  it('returns a page whose reviews belong to the requested product', async () => {
    const page = {
      pagination: {
        count: 1,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 1,
        previousPage: null,
      },
      reviews: [{ productId: 'prod_de_product' }],
    }
    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue(page)

    await expect(
      getProductReviewsPage({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
          query,
        },
      }),
    ).resolves.toBe(page)
    expect(client.request).toHaveBeenCalledWith(
      'GET',
      '/products/prod_de_product/reviews',
      { params: { limit: 5, page: 1, sort: 'most_recent' } },
    )
  })

  it('collects every photo-review page while preserving active filters', async () => {
    const firstReview = {
      id: 'rev_first',
      productId: 'prod_de_product',
    }
    const secondReview = {
      id: 'rev_second',
      productId: 'prod_de_product',
    }
    const thirdReview = {
      id: 'rev_third',
      productId: 'prod_de_product',
    }
    const page = (
      pageNumber: number,
      review: { id: string; productId: string },
    ) => ({
      pagination: {
        count: 3,
        limit: 5,
        nextPage: pageNumber < 3 ? pageNumber + 1 : null,
        page: pageNumber,
        pageCount: 3,
        previousPage: pageNumber > 1 ? pageNumber - 1 : null,
      },
      reviews: [review],
    })
    client.request.mockResolvedValue({ data: [] })
    server.mapPage
      .mockReturnValueOnce(page(1, firstReview))
      .mockReturnValueOnce(page(2, secondReview))
      .mockReturnValueOnce(page(3, thirdReview))

    await expect(
      getProductReviewMediaGallery({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
          query: {
            ...query,
            answerFilters: { fit: ['relaxed'] },
            page: 3,
            ratings: ['5'],
            verifiedPurchase: true,
          },
        },
      }),
    ).resolves.toEqual([firstReview, secondReview, thirdReview])

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      'GET',
      '/products/prod_de_product/reviews',
      {
        params: {
          limit: 5,
          page: 1,
          sort: 'most_recent',
          rating: '5',
          with_images: true,
          verified_purchase: true,
          'answers[fit]': 'relaxed',
        },
      },
    )
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/products/prod_de_product/reviews',
      {
        params: expect.objectContaining({ page: 2, with_images: true }),
      },
    )
    expect(client.request).toHaveBeenNthCalledWith(
      3,
      'GET',
      '/products/prod_de_product/reviews',
      {
        params: expect.objectContaining({ page: 3, with_images: true }),
      },
    )
  })

  it('rejects another product review found on a later photo-gallery page', async () => {
    client.request.mockResolvedValue({ data: [] })
    server.mapPage
      .mockReturnValueOnce({
        pagination: {
          count: 2,
          limit: 5,
          nextPage: 2,
          page: 1,
          pageCount: 2,
          previousPage: null,
        },
        reviews: [{ productId: 'prod_de_product' }],
      })
      .mockReturnValueOnce({
        pagination: {
          count: 2,
          limit: 5,
          nextPage: null,
          page: 2,
          pageCount: 2,
          previousPage: 1,
        },
        reviews: [{ productId: 'prod_other_product' }],
      })

    await expect(
      getProductReviewMediaGallery({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
          query,
        },
      }),
    ).rejects.toThrow('does not match the requested product')
    expect(server.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'reviews.product.media_gallery' }),
    )
  })

  it('fails closed when the page contains another product review', async () => {
    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue({
      pagination: {
        count: 2,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 1,
        previousPage: null,
      },
      reviews: [
        { productId: 'prod_de_product' },
        { productId: 'prod_other_product' },
      ],
    })

    await expect(
      getProductReviewsPage({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
          query,
        },
      }),
    ).rejects.toThrow('does not match the requested product')
    expect(server.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'reviews.product.page' }),
    )
  })

  it('fails closed when the page contains a review without a product resource id', async () => {
    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue({
      pagination: {
        count: 1,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 1,
        previousPage: null,
      },
      reviews: [{ productId: 'localized-product-slug' }],
    })

    await expect(
      getProductReviewsPage({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'localized-product-slug',
          query,
        },
      }),
    ).rejects.toThrow('not a product resource')
    expect(server.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'reviews.product.page' }),
    )
  })

  it('accepts an overview whose summary and initial page belong to the product', async () => {
    const page = {
      pagination: {
        count: 1,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 1,
        previousPage: null,
      },
      reviews: [{ productId: 'prod_de_product' }],
    }
    const summary = {
      averageRating: 5,
      productId: 'prod_de_product',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      reviewCount: 1,
    }
    const filters = {
      defaultSort: 'most_recent' as const,
      filters: [],
      sortOptions: [],
    }

    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue(page)
    const mapper = await import('../mappers/product-review.mapper')
    vi.mocked(mapper.mapProductReviewSummary).mockReturnValue(summary)
    vi.mocked(mapper.mapProductReviewFilters).mockReturnValue(filters)

    await expect(
      getProductReviewsOverview({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
        },
      }),
    ).resolves.toEqual({
      filters,
      initialPage: page,
      status: 'ready',
      summary,
    })
    expect(client.request).toHaveBeenCalledWith(
      'GET',
      '/products/prod_de_product/reviews',
      { params: { limit: 5, page: 1, sort: 'most_recent' } },
    )
  })

  it('fails closed when the overview summary belongs to another product', async () => {
    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue({ pagination: {}, reviews: [] })
    const mapper = await import('../mappers/product-review.mapper')
    vi.mocked(mapper.mapProductReviewSummary).mockReturnValue({
      averageRating: 4,
      productId: 'prod_other_product',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
      reviewCount: 1,
    })

    await expect(
      getProductReviewsOverview({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
        },
      }),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(server.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'reviews.product.overview' }),
    )
  })

  it('fails closed when the overview initial page contains another product review', async () => {
    client.request.mockResolvedValue({ data: [] })
    server.mapPage.mockReturnValue({
      pagination: {
        count: 1,
        limit: 10,
        nextPage: null,
        page: 1,
        pageCount: 1,
        previousPage: null,
      },
      reviews: [{ productId: 'prod_other_product' }],
    })
    const mapper = await import('../mappers/product-review.mapper')
    vi.mocked(mapper.mapProductReviewSummary).mockReturnValue({
      averageRating: 0,
      productId: 'prod_de_product',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviewCount: 0,
    })

    await expect(
      getProductReviewsOverview({
        data: {
          market: { country: 'de', locale: 'de-DE' },
          productId: 'prod_de_product',
        },
      }),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(server.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'reviews.product.overview' }),
    )
  })
})
