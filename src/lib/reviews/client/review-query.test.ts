import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import {
  clearProductReviewSessionState,
  getProductReviewSessionGeneration,
  productReviewFormQueryKey,
  productReviewsQueryKey,
} from './review-query'

describe('review session cleanup', () => {
  it('clears review forms and viewer projections while preserving unrelated catalog state', () => {
    const client = new QueryClient()
    const formKey = [
      ...productReviewFormQueryKey,
      'cust_customer',
      'us',
      'en',
      'or_order',
    ]
    const reviewKey = [...productReviewsQueryKey, 'us', 'en', 'prod_product']
    client.setQueryData(formKey, { eligibility: { canReview: true } })
    client.setQueryData(reviewKey, { viewerVote: 'helpful' })
    client.setQueryData(['products', 'us', 'en'], { products: [] })
    const generation = getProductReviewSessionGeneration()
    clearProductReviewSessionState(client)
    expect(client.getQueryData(formKey)).toBeUndefined()
    expect(client.getQueryData(reviewKey)).toBeUndefined()
    expect(client.getQueryData(['products', 'us', 'en'])).toEqual({
      products: [],
    })
    expect(getProductReviewSessionGeneration()).toBe(generation + 1)
    client.clear()
  })
})
