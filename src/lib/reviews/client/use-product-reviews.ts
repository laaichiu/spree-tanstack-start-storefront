import {
  keepPreviousData,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useRef } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'
import {
  isInitialProductReviewQuery,
  replaceProductReview,
} from '@/lib/reviews/contracts'
import type {
  ProductReview,
  ProductReviewQuery,
  ProductReviewsPage,
  ProductReviewSort,
  ProductReviewVote,
} from '@/lib/reviews/contracts'

import { getProductReviewsPage } from '../api/product-reviews.functions'
import { voteOnProductReview } from '../api/review-vote.functions'
import {
  getProductReviewVoteMutationKey,
  getProductReviewVoteMutationScopeId,
} from './review-mutation'
import {
  getProductReviewSessionGeneration,
  productReviewsQueryKey,
  useProductReviewSessionGeneration,
} from './review-query'

export { productReviewsQueryKey } from './review-query'

type ProductReviewVoteVariables = {
  ownerKey?: string
  reviewId: string
  vote: ProductReviewVote
}

type ProductReviewVoteMutationState = {
  reviewId: string | null
  status: 'error' | 'idle' | 'pending' | 'success'
  submittedAt: number
}

type ProductReviewVoteMutationContext = {
  sessionGeneration: number
}

function hasPendingVoteForReview(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationKey: readonly unknown[],
  reviewId: string,
) {
  return queryClient
    .getMutationCache()
    .findAll({ mutationKey })
    .some((mutation) => {
      if (mutation.state.status !== 'pending') {
        return false
      }

      const variables = mutation.state.variables

      return (
        variables !== null &&
        typeof variables === 'object' &&
        !Array.isArray(variables) &&
        'reviewId' in variables &&
        variables.reviewId === reviewId
      )
    })
}

function getLatestProductReviewVoteState(
  states: ProductReviewVoteMutationState[],
  reviewId: string,
) {
  return states
    .filter((state) => state.reviewId === reviewId)
    .reduce<ProductReviewVoteMutationState | undefined>(
      (latest, state) =>
        !latest || state.submittedAt >= latest.submittedAt ? state : latest,
      undefined,
    )
}

export function useProductReviews({
  defaultSort,
  initialPage,
  market,
  productId,
  query,
}: {
  defaultSort: ProductReviewSort
  initialPage: ProductReviewsPage
  market: MarketSelectionInput
  productId: string
  query: ProductReviewQuery
}) {
  const getProductReviewsPageFn = useServerFn(getProductReviewsPage)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  return useQuery({
    initialData: isInitialProductReviewQuery(query, defaultSort)
      ? initialPage
      : undefined,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const page = await getProductReviewsPageFn({
        data: {
          market: marketInput,
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

export function useProductReviewVote({
  market,
  productId,
}: {
  market: MarketSelectionInput
  productId: string
}) {
  const queryClient = useQueryClient()
  const voteOnProductReviewFn = useServerFn(voteOnProductReview)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const sessionGeneration = useProductReviewSessionGeneration()
  const mutationKey = getProductReviewVoteMutationKey({ market, productId })
  const voteOwnerKey = `${mutationKey.join(':')}:${sessionGeneration}`
  const mutationStates = useMutationState<ProductReviewVoteMutationState>({
    filters: { mutationKey },
    select: (mutation) => {
      const variables = mutation.state.variables as
        ProductReviewVoteVariables | undefined

      return {
        reviewId: variables?.reviewId ?? null,
        status: mutation.state.status,
        submittedAt: mutation.state.submittedAt,
      }
    },
  })

  const mutation = useMutation<
    ProductReview,
    Error,
    ProductReviewVoteVariables,
    ProductReviewVoteMutationContext
  >({
    mutationKey,
    scope: {
      id: getProductReviewVoteMutationScopeId({ market, productId }),
    },
    mutationFn: ({
      reviewId,
      vote,
    }: {
      reviewId: string
      vote: ProductReviewVote
    }) =>
      voteOnProductReviewFn({
        data: {
          market: marketInput,
          productId,
          reviewId,
          vote,
        },
      }),
    onMutate: async (variables) => {
      const mutationSessionGeneration = getProductReviewSessionGeneration()

      if (
        variables.ownerKey &&
        (variables.ownerKey !== voteOwnerKey ||
          sessionGeneration !== mutationSessionGeneration)
      ) {
        return { sessionGeneration: mutationSessionGeneration }
      }

      await queryClient.cancelQueries({
        queryKey: [
          ...productReviewsQueryKey,
          market.country,
          market.locale,
          productId,
        ],
      })

      return { sessionGeneration: mutationSessionGeneration }
    },
    onSuccess: (review, variables, context) => {
      if (
        (variables.ownerKey && variables.ownerKey !== voteOwnerKey) ||
        context.sessionGeneration !== getProductReviewSessionGeneration()
      ) {
        return
      }

      queryClient.setQueriesData<ProductReviewsPage>(
        {
          queryKey: [
            ...productReviewsQueryKey,
            market.country,
            market.locale,
            productId,
          ],
        },
        (page) => replaceProductReview(page, review),
      )
    },
  })
  const voteInFlightRef = useRef(new Set<string>())

  const submitVote = useCallback(
    (variables: ProductReviewVoteVariables) => {
      const ownerReviewKey = `${voteOwnerKey}:${variables.reviewId}`

      if (
        voteInFlightRef.current.has(ownerReviewKey) ||
        hasPendingVoteForReview(queryClient, mutationKey, variables.reviewId)
      ) {
        return
      }

      voteInFlightRef.current.add(ownerReviewKey)
      mutation.mutate(
        { ...variables, ownerKey: voteOwnerKey },
        {
          onSettled: () => {
            voteInFlightRef.current.delete(ownerReviewKey)
          },
        },
      )
    },
    [mutation, mutationKey, queryClient, voteOwnerKey],
  )

  return {
    ...mutation,
    hasErrorForReview: (reviewId: string) =>
      getLatestProductReviewVoteState(mutationStates, reviewId)?.status ===
      'error',
    isPendingForReview: (reviewId: string) =>
      getLatestProductReviewVoteState(mutationStates, reviewId)?.status ===
      'pending',
    submitVote,
  }
}
