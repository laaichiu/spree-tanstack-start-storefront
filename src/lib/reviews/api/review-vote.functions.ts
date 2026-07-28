import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/market/model/market'

import { isReviewsFeatureEnabled } from '../config/reviews-config.server'
import { mapProductReview } from '../mappers/product-review.mapper'
import type { ProductReview, ProductReviewVote } from '../model/product-review'
import {
  getReviewsRequestOptions,
  resolveReviewsRequestContext,
} from './reviews-request.server'

type ReviewVoteInput = {
  market: MarketSelectionInput
  reviewId: string
  vote: ProductReviewVote
}

async function parseVoteInput(data: ReviewVoteInput) {
  const { serverZod: z } = await import('@/lib/validation/server-zod.server')
  const { marketInputSchema } = await import('@/lib/market/utils/market-input')

  return z
    .object({
      market: marketInputSchema,
      reviewId: z.string().trim().min(1),
      vote: z.enum(['helpful', 'not_helpful']),
    })
    .parse(data)
}

export const voteOnProductReview = createServerFn({ method: 'POST' })
  .validator((data: ReviewVoteInput) => data)
  .handler(async ({ data }): Promise<ProductReview> => {
    if (!isReviewsFeatureEnabled()) {
      throw new Error('Product reviews are disabled.')
    }

    const input = await parseVoteInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }
    const activeContext = context

    async function requestVote(
      client: typeof activeContext.client,
      token?: string,
    ) {
      const response = await client.request<unknown>(
        'POST',
        `/reviews/${encodeURIComponent(input.reviewId)}/helpful_votes`,
        {
          ...getReviewsRequestOptions(activeContext.market, token),
          body: { vote: input.vote },
        },
      )
      const review = mapProductReview(response)

      if (!review) {
        throw new Error('The review vote response was invalid.')
      }

      return review
    }

    const { CustomerSessionRequiredError, withCustomerSession } =
      await import('@/lib/account/api/customer-session.server')

    try {
      return await withCustomerSession(({ client, token }) =>
        requestVote(client, token),
      )
    } catch (error) {
      if (!(error instanceof CustomerSessionRequiredError)) {
        throw error
      }

      return requestVote(activeContext.client)
    }
  })
