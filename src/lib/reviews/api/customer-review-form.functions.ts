import { createServerFn } from '@tanstack/react-start'

import type { ProductReviewFormState } from '../model/product-review'
import {
  parsePurchaseInput,
  requireReviewsEnabled,
} from './customer-review-inputs.server'
import type { ReviewPurchaseInput } from './customer-review-inputs.server'
import {
  getReviewsRequestOptions,
  productReviewsPath,
  resolveReviewsRequestContext,
} from './reviews-request.server'
import { assertReviewProductResourceMatchesRequestedLocator } from '../utils/review-product-identity'

function assertReviewEligibilityMatchesRequest(
  form: ProductReviewFormState,
  input: ReviewPurchaseInput,
) {
  if (
    form.eligibility.orderId !== input.orderId ||
    form.eligibility.variantId !== input.variantId ||
    (form.eligibility.eligibleOrderId !== null &&
      form.eligibility.eligibleOrderId !== input.orderId)
  ) {
    throw new Error(
      'The review eligibility response does not match the request.',
    )
  }

  assertReviewProductResourceMatchesRequestedLocator(
    form.eligibility,
    input.productId,
  )
}

export const getCustomerProductReviewForm = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReviewFormState> => {
    requireReviewsEnabled()
    const input = await parsePurchaseInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const { withCustomerSession } =
      await import('@/lib/account/api/customer-session.server')

    return withCustomerSession(
      async ({ client, token }) => {
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

        const { mapProductReviewFormState } =
          await import('../mappers/product-review-form.mapper')

        const form = mapProductReviewFormState({ eligibility, questions })
        assertReviewEligibilityMatchesRequest(form, input)

        return form
      },
      { client: context.client },
    )
  })
