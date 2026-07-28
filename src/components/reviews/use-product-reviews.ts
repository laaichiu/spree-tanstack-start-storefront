import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'
import { getProductReviewsPage } from '@/lib/reviews/api/product-reviews.functions'
import { voteOnProductReview } from '@/lib/reviews/api/review-vote.functions'
import type {
  ProductReview,
  ProductReviewQuery,
  ProductReviewsPage,
  ProductReviewVote,
} from '@/lib/reviews/model/product-review'

export const productReviewsQueryKey = ['product-reviews'] as const

function isInitialQuery(query: ProductReviewQuery, defaultSort: string) {
  return (
    query.page === 1 &&
    query.sort === defaultSort &&
    query.ratings.length === 0 &&
    !query.withImages &&
    !query.verifiedPurchase &&
    Object.values(query.answerFilters).every(
      (values) => !values || values.length === 0,
    )
  )
}

export function useProductReviews({
  defaultSort,
  initialPage,
  productId,
  query,
}: {
  defaultSort: string
  initialPage: ProductReviewsPage
  productId: string
  query: ProductReviewQuery
}) {
  const { market } = useMarket()
  const getProductReviewsPageFn = useServerFn(getProductReviewsPage)

  return useQuery({
    initialData: isInitialQuery(query, defaultSort) ? initialPage : undefined,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const page = await getProductReviewsPageFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
          productId,
          query,
        },
      })

      if (!page) {
        throw new Error('Product reviews are disabled.')
      }

      return page
    },
    queryKey: [
      ...productReviewsQueryKey,
      market.country,
      market.locale,
      productId,
      query,
    ],
    staleTime: 30_000,
  })
}

function replaceReview(
  page: ProductReviewsPage | undefined,
  updatedReview: ProductReview,
) {
  if (!page) {
    return page
  }

  return {
    ...page,
    reviews: page.reviews.map((review) =>
      review.id === updatedReview.id ? updatedReview : review,
    ),
  }
}

export function useProductReviewVote(productId: string) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const voteOnProductReviewFn = useServerFn(voteOnProductReview)

  return useMutation({
    mutationFn: ({
      reviewId,
      vote,
    }: {
      reviewId: string
      vote: ProductReviewVote
    }) =>
      voteOnProductReviewFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
          reviewId,
          vote,
        },
      }),
    onSuccess: (review) => {
      queryClient.setQueriesData<ProductReviewsPage>(
        {
          queryKey: [
            ...productReviewsQueryKey,
            market.country,
            market.locale,
            productId,
          ],
        },
        (page) => replaceReview(page, review),
      )
    },
  })
}
