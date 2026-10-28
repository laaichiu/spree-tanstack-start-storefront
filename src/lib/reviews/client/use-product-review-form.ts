import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  getProductReviewFormQueryKey,
  useProductReviewSessionGeneration,
} from './review-query'

import { getCustomerProductReviewForm } from '../api/customer-reviews.functions'

export function useProductReviewForm({
  customerId,
  item,
  market,
  orderId,
}: {
  customerId: string
  item: { productId: string; variantId: string }
  market: MarketSelectionInput
  orderId: string
}) {
  const getCustomerProductReviewFormFn = useServerFn(
    getCustomerProductReviewForm,
  )
  const sessionGeneration = useProductReviewSessionGeneration()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  return useQuery({
    queryFn: () =>
      getCustomerProductReviewFormFn({
        data: {
          market: marketInput,
          orderId,
          productId: item.productId,
          variantId: item.variantId,
        },
      }),
    queryKey: getProductReviewFormQueryKey({
      customerId,
      item,
      market,
      orderId,
      sessionGeneration,
    }),
    staleTime: 30_000,
  })
}
