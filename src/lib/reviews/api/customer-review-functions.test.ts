// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCustomerProductReviewForm } from './customer-review-form.functions'
import { submitCustomerProductReview } from './customer-review-submit.functions'

const server = vi.hoisted(() => ({
  mapForm: vi.fn(),
  mapReview: vi.fn(),
  parsePurchaseInput: vi.fn(),
  parseSubmitInput: vi.fn(),
  requireReviewsEnabled: vi.fn(),
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

vi.mock('./customer-review-inputs.server', () => ({
  parsePurchaseInput: server.parsePurchaseInput,
  parseSubmitInput: server.parseSubmitInput,
  requireReviewsEnabled: server.requireReviewsEnabled,
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
  productReviewsPath: (productId: string, suffix = '') =>
    `/products/${encodeURIComponent(productId)}/reviews${suffix}`,
  resolveReviewsRequestContext: server.resolveReviewsRequestContext,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  withCustomerSession: server.withCustomerSession,
}))

vi.mock('../mappers/product-review-form.mapper', () => ({
  mapProductReviewFormState: server.mapForm,
}))

vi.mock('../mappers/product-review.mapper', () => ({
  mapProductReview: server.mapReview,
}))

describe('customer review market client boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.parsePurchaseInput.mockImplementation(async (data) => data)
    server.parseSubmitInput.mockImplementation(async (data) => data)
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

  it('uses the resolved market client for the customer review form', async () => {
    const form = {
      eligibility: {
        canReview: true,
        eligibleOrderId: 'or_de_order',
        orderId: 'or_de_order',
        productId: 'prod_de_product',
        reason: null,
        variantId: 'variant_de_variant',
      },
      questions: [],
    }
    marketClient.request
      .mockResolvedValueOnce({ eligible: true })
      .mockResolvedValueOnce({ questions: [] })
    server.mapForm.mockReturnValue(form)

    await expect(
      getCustomerProductReviewForm({
        data: {
          market: marketInput,
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          variantId: 'variant_de_variant',
        },
      }),
    ).resolves.toBe(form)

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client: marketClient },
    )
    expect(marketClient.request).toHaveBeenNthCalledWith(
      1,
      'GET',
      '/products/prod_de_product/reviews/eligibility',
      {
        country: 'de',
        currency: 'EUR',
        locale: 'de-DE',
        params: {
          order_id: 'or_de_order',
          variant_id: 'variant_de_variant',
        },
        token: 'customer-token',
      },
    )
    expect(marketClient.request).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/products/prod_de_product/reviews/questions',
      {
        country: 'de',
        currency: 'EUR',
        locale: 'de-DE',
        token: 'customer-token',
      },
    )
    expect(defaultClient.request).not.toHaveBeenCalled()
  })

  it('rejects eligibility for another order or variant', async () => {
    marketClient.request
      .mockResolvedValueOnce({ eligible: true })
      .mockResolvedValueOnce({ questions: [] })
    server.mapForm.mockReturnValue({
      eligibility: {
        canReview: true,
        orderId: 'or_other_order',
        productId: 'prod_de_product',
        reason: null,
        variantId: 'variant_other_variant',
      },
      questions: [],
    })

    await expect(
      getCustomerProductReviewForm({
        data: {
          market: marketInput,
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('does not match the request')
  })

  it('rejects an eligible order belonging to another order context', async () => {
    marketClient.request
      .mockResolvedValueOnce({ eligible: true })
      .mockResolvedValueOnce({ questions: [] })
    server.mapForm.mockReturnValue({
      eligibility: {
        canReview: true,
        eligibleOrderId: 'or_other_order',
        orderId: 'or_de_order',
        productId: 'prod_de_product',
        reason: null,
        variantId: 'variant_de_variant',
      },
      questions: [],
    })

    await expect(
      getCustomerProductReviewForm({
        data: {
          market: marketInput,
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('does not match the request')
  })

  it('rejects eligibility without a canonical product resource response', async () => {
    marketClient.request
      .mockResolvedValueOnce({ eligible: true })
      .mockResolvedValueOnce({ questions: [] })
    server.mapForm.mockReturnValue({
      eligibility: {
        canReview: true,
        eligibleOrderId: 'or_de_order',
        orderId: 'or_de_order',
        productId: 'other-product-slug',
        reason: null,
        variantId: 'variant_de_variant',
      },
      questions: [],
    })

    await expect(
      getCustomerProductReviewForm({
        data: {
          market: marketInput,
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('not a product resource')
  })

  it('uses the resolved market client for customer review submission', async () => {
    const review = {
      id: 'rev_de_review',
      productId: 'prod_de_product',
      variantId: 'variant_de_variant',
    }
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue(review)

    await expect(
      submitCustomerProductReview({
        data: {
          answers: { fit: ['true'] },
          body: 'A useful review.',
          market: marketInput,
          media: [{ alt: 'front', signedId: 'signed_de_image' }],
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          rating: 5,
          title: 'Great fit',
          variantId: 'variant_de_variant',
        },
      }),
    ).resolves.toBe(review)

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client: marketClient },
    )
    expect(marketClient.request).toHaveBeenCalledWith(
      'POST',
      '/products/prod_de_product/reviews',
      {
        body: {
          answers: { fit: ['true'] },
          body: 'A useful review.',
          images: [{ alt: 'front', signed_id: 'signed_de_image' }],
          locale: 'de-DE',
          order_id: 'or_de_order',
          rating: 5,
          title: 'Great fit',
          variant_id: 'variant_de_variant',
        },
        country: 'de',
        currency: 'EUR',
        locale: 'de-DE',
        token: 'customer-token',
      },
    )
    expect(defaultClient.request).not.toHaveBeenCalled()
  })

  it('rejects a submitted review belonging to another product', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_other_product' })
    server.mapReview.mockReturnValue({
      id: 'rev_other_product',
      productId: 'prod_other_product',
      variantId: 'variant_de_variant',
    })

    await expect(
      submitCustomerProductReview({
        data: {
          answers: {},
          body: 'A useful review.',
          market: marketInput,
          media: [],
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          rating: 5,
          title: 'Great fit',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('does not match the request')
  })

  it('accepts a canonical response when the request used a product slug', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    const review = {
      id: 'rev_de_review',
      productId: 'prod_de_product',
      variantId: 'variant_de_variant',
    }
    server.mapReview.mockReturnValue(review)

    await expect(
      submitCustomerProductReview({
        data: {
          answers: {},
          body: 'A useful review.',
          market: marketInput,
          media: [],
          orderId: 'or_de_order',
          productId: 'localized-product-slug',
          rating: 5,
          title: 'Great fit',
          variantId: 'variant_de_variant',
        },
      }),
    ).resolves.toBe(review)
  })

  it('rejects a submitted review belonging to another variant', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue({
      id: 'rev_de_review',
      productId: 'prod_de_product',
      variantId: 'variant_other_variant',
    })

    await expect(
      submitCustomerProductReview({
        data: {
          answers: {},
          body: 'A useful review.',
          market: marketInput,
          media: [],
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          rating: 5,
          title: 'Great fit',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('does not match the requested variant')
  })

  it('rejects a submitted review without a variant identity', async () => {
    marketClient.request.mockResolvedValue({ id: 'rev_de_review' })
    server.mapReview.mockReturnValue({
      id: 'rev_de_review',
      productId: 'prod_de_product',
      variantId: null,
    })

    await expect(
      submitCustomerProductReview({
        data: {
          answers: {},
          body: 'A useful review.',
          market: marketInput,
          media: [],
          orderId: 'or_de_order',
          productId: 'prod_de_product',
          rating: 5,
          title: 'Great fit',
          variantId: 'variant_de_variant',
        },
      }),
    ).rejects.toThrow('not a variant resource')
  })
})
