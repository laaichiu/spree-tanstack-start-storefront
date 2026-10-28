// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { voteOnProductReview } from './review-vote.functions'

const server = vi.hoisted(() => ({
  mapReview: vi.fn(),
  resolveReviewsRequestContext: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const marketClient = {
  request: vi.fn(),
}

const defaultClient = {
  request: vi.fn(),
}

const marketInput = { country: 'de', locale: 'de-DE' }
const resolvedMarket = {
  country: 'de',
  currencyCode: 'EUR',
  locale: 'de-DE',
}

class TestCustomerSessionRequiredError extends Error {}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let inputValidator: unknown
    const builder = {
      handler: (handler: unknown) => (options: { data: unknown }) => {
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
  isReviewsFeatureEnabled: () => true,
}))

vi.mock('./reviews-request.server', () => ({
  getReviewsRequestOptions: (
    market: typeof resolvedMarket,
    token?: string,
  ) => ({
    country: market.country,
    currency: market.currencyCode,
    locale: market.locale,
    ...(token ? { token } : {}),
  }),
  resolveReviewsRequestContext: server.resolveReviewsRequestContext,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  CustomerSessionRequiredError: TestCustomerSessionRequiredError,
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('../mappers/product-review.mapper', () => ({
  mapProductReview: server.mapReview,
}))

describe('review vote market client boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveReviewsRequestContext.mockResolvedValue({
      client: marketClient,
      market: resolvedMarket,
    })
    server.withCustomerSession.mockImplementation(
      async (
        action: (context: {
          client: typeof marketClient
          token: string
        }) => unknown,
        options?: { client?: typeof marketClient },
      ) =>
        action({
          client: options?.client ?? defaultClient,
          token: 'customer-token',
        }),
    )
  })

  it('uses the resolved market client for an authenticated vote', async () => {
    const review = {
      id: 'rev_de_review',
      productId: 'prod_de_product',
    }
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue(review)

    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'rev_de_review',
          vote: 'helpful',
        },
      }),
    ).resolves.toBe(review)

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client: marketClient },
    )
    expect(marketClient.request).toHaveBeenCalledWith(
      'POST',
      '/reviews/rev_de_review/helpful_votes',
      {
        body: { vote: 'helpful' },
        country: 'de',
        currency: 'EUR',
        locale: 'de-DE',
        token: 'customer-token',
      },
    )
    expect(defaultClient.request).not.toHaveBeenCalled()
  })

  it('keeps the market client for the anonymous fallback', async () => {
    const review = {
      id: 'rev_de_review',
      productId: 'prod_de_product',
    }
    server.withCustomerSession.mockRejectedValue(
      new TestCustomerSessionRequiredError(),
    )
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue(review)

    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'rev_de_review',
          vote: 'not_helpful',
        },
      }),
    ).resolves.toBe(review)

    expect(marketClient.request).toHaveBeenCalledWith(
      'POST',
      '/reviews/rev_de_review/helpful_votes',
      {
        body: { vote: 'not_helpful' },
        country: 'de',
        currency: 'EUR',
        locale: 'de-DE',
      },
    )
    expect(defaultClient.request).not.toHaveBeenCalled()
  })

  it('rejects a vote response for another review', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_other_review' })
    server.mapReview.mockReturnValue({
      id: 'rev_other_review',
      productId: 'prod_de_product',
    })

    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'rev_de_review',
          vote: 'helpful',
        },
      }),
    ).rejects.toThrow('does not match the request')
  })

  it('rejects a non-review input before resolving the market context', async () => {
    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'card_not-a-review',
          vote: 'helpful',
        },
      }),
    ).rejects.toThrow('Expected a Review resource id.')

    expect(server.resolveReviewsRequestContext).not.toHaveBeenCalled()
    expect(marketClient.request).not.toHaveBeenCalled()
  })

  it('rejects a non-review response before returning it to the caller', async () => {
    marketClient.request.mockResolvedValue({ id: 'card_not-a-review' })
    server.mapReview.mockReturnValue({ id: 'card_not-a-review' })

    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'rev_de_review',
          vote: 'helpful',
        },
      }),
    ).rejects.toThrow('not a review resource')
  })

  it('rejects a vote response belonging to another product', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue({
      id: 'rev_de_review',
      productId: 'prod_other_product',
    })

    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'prod_de_product',
          reviewId: 'rev_de_review',
          vote: 'helpful',
        },
      }),
    ).rejects.toThrow('does not match the requested product')
  })

  it('rejects a non-product owner input before resolving the market context', async () => {
    await expect(
      voteOnProductReview({
        data: {
          market: marketInput,
          productId: 'localized-product-slug',
          reviewId: 'rev_de_review',
          vote: 'helpful',
        },
      }),
    ).rejects.toThrow('Expected a Product resource id.')

    expect(server.resolveReviewsRequestContext).not.toHaveBeenCalled()
    expect(marketClient.request).not.toHaveBeenCalled()
  })
})
