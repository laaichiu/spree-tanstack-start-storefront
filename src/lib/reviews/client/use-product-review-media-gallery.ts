import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import type { ProductReviewQuery } from '@/lib/reviews/contracts'

import { getProductReviewMediaGallery } from '../api/product-reviews.functions'
import {
  productReviewMediaGalleryQueryKey,
  useProductReviewSessionGeneration,
} from './review-query'

export function useProductReviewMediaGallery({
  enabled,
  market,
  productId,
  query,
}: {
  enabled: boolean
  market: MarketSelectionInput
  productId: string
  query: ProductReviewQuery
}) {
  const getProductReviewMediaGalleryFn = useServerFn(
    getProductReviewMediaGallery,
  )
  const sessionGeneration = useProductReviewSessionGeneration()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const galleryQuery = { ...query, page: 1, withImages: true }

  return useQuery({
    enabled,
    queryFn: async () => {
      const reviews = await getProductReviewMediaGalleryFn({
        data: {
          market: marketInput,
          productId,
          query: galleryQuery,
        },
      })

      if (!reviews) {
        throw new Error('Product review photos are unavailable.')
      }

      return reviews
    },
    queryKey: [
      ...productReviewMediaGalleryQueryKey,
      market.country,
      market.locale,
      productId,
      sessionGeneration,
      galleryQuery,
    ],
    staleTime: 30_000,
  })
}
