import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import {
  mapProductReviewFormState,
  mapProductReviewMediaUpload,
} from '../mappers/product-review-form.mapper'
import { mapProductReview } from '../mappers/product-review.mapper'
import type {
  ProductReview,
  ProductReviewFormState,
  ProductReviewMediaUpload,
  SubmitProductReviewInput,
} from '../model/product-review'
import {
  getReviewsRequestOptions,
  productReviewsPath,
  resolveReviewsRequestContext,
} from './reviews-request.server'

type ReviewPurchaseInput = {
  market: MarketSelectionInput
  orderId: string
  productId: string
  variantId: string
}

type SubmitReviewRequest = ReviewPurchaseInput & SubmitProductReviewInput

type ReviewMediaUploadInput = {
  byteSize: number
  checksum: string
  contentType: string
  filename: string
  market: MarketSelectionInput
}

const REVIEW_IMAGE_TYPES = [
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024

async function parsePurchaseInput(data: ReviewPurchaseInput) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      orderId: z.string().trim().min(1),
      productId: z.string().trim().min(1),
      variantId: z.string().trim().min(1),
    })
    .parse(data)
}

async function parseSubmitInput(data: SubmitReviewRequest) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const purchase = await parsePurchaseInput(data)

  const review = z
    .object({
      answers: z.record(z.string(), z.json()),
      body: z.string().trim().max(10_000),
      media: z
        .array(
          z.object({
            alt: z.string().trim().max(240),
            signedId: z.string().trim().min(1),
          }),
        )
        .max(5),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(1).max(120),
    })
    .parse(data)
  const answers: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(review.answers)) {
    if (typeof value === 'string') {
      answers[key] = value
    } else if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      answers[key] = value
    }
  }

  return {
    ...purchase,
    ...review,
    answers,
  }
}

async function parseMediaUploadInput(data: ReviewMediaUploadInput) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      byteSize: z.number().int().positive().max(MAX_REVIEW_IMAGE_BYTES),
      checksum: z.string().trim().min(1),
      contentType: z.enum(REVIEW_IMAGE_TYPES),
      filename: z.string().trim().min(1).max(255),
      market: marketInputSchema,
    })
    .parse(data)
}

function requireReviewsEnabled() {
  if (!isReviewsFeatureEnabled()) {
    throw new Error('Product reviews are disabled.')
  }
}

export const getCustomerProductReviewForm = createServerFn({ method: 'GET' })
  .validator((data: ReviewPurchaseInput) => data)
  .handler(async ({ data }): Promise<ProductReviewFormState> => {
    requireReviewsEnabled()
    const input = await parsePurchaseInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const { withCustomerSession } =
      await import('@/lib/account/api/customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const options = getReviewsRequestOptions(context.market, token)
      const [eligibility, questions] = await Promise.all([
        client.request<unknown>(
          'GET',
          productReviewsPath(input.productId, '/eligibility'),
          {
            ...options,
            params: {
              order_id: input.orderId,
              variant_id: input.variantId,
            },
          },
        ),
        client.request<unknown>(
          'GET',
          productReviewsPath(input.productId, '/questions'),
          options,
        ),
      ])

      return mapProductReviewFormState({ eligibility, questions })
    })
  })

export const createProductReviewMediaUpload = createServerFn({ method: 'POST' })
  .validator((data: ReviewMediaUploadInput) => data)
  .handler(async ({ data }): Promise<ProductReviewMediaUpload> => {
    requireReviewsEnabled()
    const input = await parseMediaUploadInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const response = await context.client.request<unknown>(
      'POST',
      '/review_media/direct_uploads',
      {
        body: {
          blob: {
            byte_size: input.byteSize,
            checksum: input.checksum,
            content_type: input.contentType,
            filename: input.filename,
          },
        },
      },
    )
    const upload = mapProductReviewMediaUpload(response)

    if (!upload.signedId || !upload.url) {
      throw new Error('Review image upload could not be prepared.')
    }

    return upload
  })

export const submitCustomerProductReview = createServerFn({ method: 'POST' })
  .validator((data: SubmitReviewRequest) => data)
  .handler(async ({ data }): Promise<ProductReview> => {
    requireReviewsEnabled()
    const input = await parseSubmitInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const { withCustomerSession } =
      await import('@/lib/account/api/customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const response = await client.request<unknown>(
        'POST',
        productReviewsPath(input.productId),
        {
          ...getReviewsRequestOptions(context.market, token),
          body: {
            answers: input.answers,
            body: input.body,
            images: input.media.map((media) => ({
              alt: media.alt,
              signed_id: media.signedId,
            })),
            locale: context.market.locale,
            order_id: input.orderId,
            rating: input.rating,
            title: input.title,
            variant_id: input.variantId,
          },
        },
      )
      const review = mapProductReview(response)

      if (!review) {
        throw new Error('The submitted review response was invalid.')
      }

      return review
    })
  })
