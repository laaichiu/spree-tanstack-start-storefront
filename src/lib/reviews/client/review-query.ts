import type { MarketSelectionInput } from '@/lib/core/market'
import type { QueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

export const productReviewsQueryKey = ['product-reviews'] as const
export const productReviewFormQueryKey = ['product-review-form'] as const

export function getProductReviewFormQueryKey({
  customerId,
  item,
  market,
  orderId,
  sessionGeneration,
}: {
  customerId: string
  item: { productId: string; variantId: string }
  market: MarketSelectionInput
  orderId: string
  sessionGeneration: number
}) {
  return [
    ...productReviewFormQueryKey,
    customerId,
    market.country,
    market.locale,
    orderId,
    item.productId,
    item.variantId,
    sessionGeneration,
  ] as const
}

const productReviewVoteMutationKey = ['product-review-vote'] as const
let productReviewSessionGeneration = 0
const productReviewSessionListeners = new Set<() => void>()

export function getProductReviewSessionGeneration() {
  return productReviewSessionGeneration
}

export function useProductReviewSessionGeneration() {
  return useSyncExternalStore(
    (listener) => {
      productReviewSessionListeners.add(listener)

      return () => productReviewSessionListeners.delete(listener)
    },
    getProductReviewSessionGeneration,
    () => 0,
  )
}

function advanceProductReviewSessionGeneration() {
  productReviewSessionGeneration += 1

  for (const listener of productReviewSessionListeners) {
    listener()
  }
}

export function clearProductReviewSessionState(queryClient: QueryClient) {
  advanceProductReviewSessionGeneration()
  queryClient.removeQueries({ queryKey: productReviewsQueryKey })
  queryClient.removeQueries({ queryKey: productReviewFormQueryKey })

  for (const mutation of queryClient
    .getMutationCache()
    .findAll({ mutationKey: productReviewVoteMutationKey })) {
    queryClient.getMutationCache().remove(mutation)
  }
}
