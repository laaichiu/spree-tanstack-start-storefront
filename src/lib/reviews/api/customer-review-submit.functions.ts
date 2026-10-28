import { createServerFn } from '@tanstack/react-start'

import type { ProductReview } from '@/lib/reviews/contracts'
import { mapProductReview } from '../mappers/product-review.mapper'
import {
  parseSubmitInput,
  requireReviewsEnabled,
} from './customer-review-inputs.server'
import {
  getReviewsRequestOptions,
  productReviewsPath,
  resolveReviewsRequestContext,
} from './reviews-request.server'
import {
  assertReviewProductResourceMatchesRequestedLocator,
  assertReviewVariantResourceMatchesRequestedId,
} from '../utils/review-product-identity'

export const submitCustomerProductReview = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReview> => {
    requireReviewsEnabled()
    const input = await parseSubmitInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const { withCustomerSession } =
      await import('@/lib/account/api/customer-session.server')

    return withCustomerSession(
      async ({ client, token }) => {
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

        assertReviewProductResourceMatchesRequestedLocator(
          review,
          input.productId,
        )
        assertReviewVariantResourceMatchesRequestedId(review, input.variantId)

        return review
      },
      { client: context.client },
    )
  })
