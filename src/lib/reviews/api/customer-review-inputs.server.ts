import {
  PRODUCT_REVIEW_MAX_MEDIA_COUNT,
  PRODUCT_REVIEW_MEDIA_CONTENT_TYPES,
  normalizeProductReviewAnswers,
} from '@/lib/reviews/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { REVIEW_IMAGE_MAX_BYTES } from '../review-media-policy'
import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import type { SubmitProductReviewInput } from '../model/product-review'
import {
  isReviewOrderResourceId,
  isReviewVariantResourceId,
} from '../utils/review-product-identity'

export type ReviewPurchaseInput = {
  market: MarketSelectionInput
  orderId: string
  productId: string
  variantId: string
}

export type SubmitReviewRequest = ReviewPurchaseInput & SubmitProductReviewInput

export type ReviewMediaUploadInput = {
  byteSize: number
  checksum: string
  contentType: string
  filename: string
  market: MarketSelectionInput
}

export async function parsePurchaseInput(data: unknown) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      orderId: z
        .string()
        .trim()
        .min(1)
        .refine(isReviewOrderResourceId, 'Expected an Order resource id.'),
      productId: z.string().trim().min(1),
      variantId: z
        .string()
        .trim()
        .min(1)
        .refine(isReviewVariantResourceId, 'Expected a Variant resource id.'),
    })
    .parse(data)
}

export async function parseSubmitInput(data: unknown) {
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
        .max(PRODUCT_REVIEW_MAX_MEDIA_COUNT),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(1).max(120),
    })
    .parse(data)

  return {
    ...purchase,
    ...review,
    answers: normalizeProductReviewAnswers(review.answers),
  }
}

export async function parseMediaUploadInput(data: unknown) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      byteSize: z.number().int().positive().max(REVIEW_IMAGE_MAX_BYTES),
      checksum: z.string().trim().min(1),
      contentType: z.enum(PRODUCT_REVIEW_MEDIA_CONTENT_TYPES),
      filename: z.string().trim().min(1).max(255),
      market: marketInputSchema,
    })
    .parse(data)
}

export function requireReviewsEnabled() {
  if (!isReviewsFeatureEnabled()) {
    throw new Error('Product reviews are disabled.')
  }
}
