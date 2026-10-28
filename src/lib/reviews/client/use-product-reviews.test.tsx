import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as ReactStart from '@tanstack/react-start'

import { getDefaultProductReviewQuery } from '@/lib/reviews/contracts'
import type { ProductReview, ProductReviewsPage } from '@/lib/reviews/contracts'
import { useCustomerLogin } from '@/lib/account/client/use-customer-login'

import {
  productReviewsQueryKey,
  useProductReviewVote,
  useProductReviews,
} from './use-product-reviews'

const server = vi.hoisted(() => ({
  getProductReviewsPage: vi.fn(),
  loginCustomer: vi.fn(),
  voteOnProductReview: vi.fn(),
}))

vi.mock('../api/product-reviews.functions', () => ({
  getProductReviewsPage: server.getProductReviewsPage,
}))

vi.mock('../api/review-vote.functions', () => ({
  voteOnProductReview: server.voteOnProductReview,
}))

vi.mock('@/lib/account/api/login.functions', () => ({
  loginCustomer: server.loginCustomer,
}))

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactStart>()

  return {
    ...actual,
    useServerFn: (serverFn: unknown) => serverFn,
  }
})

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}

const review = {
  answers: [],
  body: 'Review body',
  createdAt: '2026-08-27T00:00:00.000Z',
  currentVote: null,
  helpfulCount: 1,
  id: 'rev_review',
  media: [],
  notHelpfulCount: 0,
  productId: 'prod_product',
  purchasedOptionValues: [],
  rating: 5,
  reviewerName: null,
  title: 'Review title',
  variantId: null,
  verifiedPurchase: false,
} satisfies ProductReview

const otherReview = {
  ...review,
  id: 'rev_other_review',
} satisfies ProductReview

const initialPage = {
  pagination: {
    count: 1,
    limit: 10,
    nextPage: null,
    page: 1,
    pageCount: 1,
    previousPage: null,
  },
  reviews: [review, otherReview],
} satisfies ProductReviewsPage

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { queryClient, Wrapper }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('product review vote mutation', () => {
  it('serializes votes for the same market and product', async () => {
    let resolveFirstVote: (value: ProductReview) => void = () => undefined
    let resolveSecondVote: (value: ProductReview) => void = () => undefined
    const firstVote = new Promise<ProductReview>((resolve) => {
      resolveFirstVote = resolve
    })
    const secondVote = new Promise<ProductReview>((resolve) => {
      resolveSecondVote = resolve
    })
    const firstResponse = { ...review, currentVote: 'helpful' as const }
    const secondResponse = {
      ...otherReview,
      currentVote: 'not_helpful' as const,
    }
    server.voteOnProductReview
      .mockReturnValueOnce(firstVote)
      .mockReturnValueOnce(secondVote)
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => useProductReviewVote({ market, productId: review.productId }),
      { wrapper: Wrapper },
    )

    let firstMutation: Promise<unknown> | undefined
    let secondMutation: Promise<unknown> | undefined
    act(() => {
      firstMutation = result.current.mutateAsync({
        reviewId: review.id,
        vote: 'helpful',
      })
      secondMutation = result.current.mutateAsync({
        reviewId: otherReview.id,
        vote: 'not_helpful',
      })
    })

    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledTimes(1),
    )
    expect(result.current.isPendingForReview(review.id)).toBe(true)
    expect(result.current.isPendingForReview(otherReview.id)).toBe(true)

    await act(async () => {
      resolveFirstVote(firstResponse)
      await firstMutation
      await waitFor(() =>
        expect(server.voteOnProductReview).toHaveBeenCalledTimes(2),
      )
    })
    expect(result.current.isPendingForReview(review.id)).toBe(false)
    expect(result.current.isPendingForReview(otherReview.id)).toBe(true)

    await act(async () => {
      resolveSecondVote(secondResponse)
      await secondMutation
    })
    await waitFor(() =>
      expect(result.current.isPendingForReview(otherReview.id)).toBe(false),
    )

    expect(server.voteOnProductReview).toHaveBeenNthCalledWith(1, {
      data: {
        market: { country: 'us', locale: 'en' },
        productId: review.productId,
        reviewId: review.id,
        vote: 'helpful',
      },
    })
    expect(server.voteOnProductReview).toHaveBeenNthCalledWith(2, {
      data: {
        market: { country: 'us', locale: 'en' },
        productId: review.productId,
        reviewId: otherReview.id,
        vote: 'not_helpful',
      },
    })
  })

  it('ignores a duplicate vote for one review before pending state rerenders', async () => {
    let resolveVote: (value: ProductReview) => void = () => undefined
    server.voteOnProductReview.mockReturnValue(
      new Promise<ProductReview>((resolve) => {
        resolveVote = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => useProductReviewVote({ market, productId: review.productId }),
      { wrapper: Wrapper },
    )

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
      result.current.submitVote({ reviewId: review.id, vote: 'not_helpful' })
    })

    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledOnce(),
    )
    expect(server.voteOnProductReview).toHaveBeenCalledWith({
      data: {
        market: { country: 'us', locale: 'en' },
        productId: review.productId,
        reviewId: review.id,
        vote: 'helpful',
      },
    })

    await act(async () => {
      resolveVote({ ...review, currentVote: 'helpful' })
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(result.current.isPendingForReview(review.id)).toBe(false),
    )
  })

  it('releases a review vote guard after failure so it can be retried', async () => {
    server.voteOnProductReview
      .mockRejectedValueOnce(new Error('vote failed'))
      .mockResolvedValueOnce({ ...review, currentVote: 'helpful' })
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => useProductReviewVote({ market, productId: review.productId }),
      { wrapper: Wrapper },
    )

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
    })

    await waitFor(() =>
      expect(result.current.hasErrorForReview(review.id)).toBe(true),
    )

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
    })

    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledTimes(2),
    )
  })

  it('keeps a pending vote guarded after the observer remounts', async () => {
    let resolveVote: (value: ProductReview) => void = () => undefined
    server.voteOnProductReview.mockReturnValue(
      new Promise<ProductReview>((resolve) => {
        resolveVote = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const first = renderHook(
      () => useProductReviewVote({ market, productId: review.productId }),
      { wrapper: Wrapper },
    )

    act(() => {
      first.result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
    })

    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledOnce(),
    )
    first.unmount()

    const second = renderHook(
      () => useProductReviewVote({ market, productId: review.productId }),
      { wrapper: Wrapper },
    )

    act(() => {
      second.result.current.submitVote({
        reviewId: review.id,
        vote: 'not_helpful',
      })
    })

    expect(server.voteOnProductReview).toHaveBeenCalledOnce()

    await act(async () => {
      resolveVote({ ...review, currentVote: 'helpful' })
      await Promise.resolve()
    })
  })

  it('keeps the new market owner guarded while the old vote settles', async () => {
    let resolveUsVote: (value: ProductReview) => void = () => undefined
    let resolveDeVote: (value: ProductReview) => void = () => undefined
    server.voteOnProductReview
      .mockReturnValueOnce(
        new Promise<ProductReview>((resolve) => {
          resolveUsVote = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<ProductReview>((resolve) => {
          resolveDeVote = resolve
        }),
      )
    const { Wrapper } = createHarness()
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useProductReviewVote({
          market: currentMarket,
          productId: review.productId,
        }),
      {
        initialProps: { currentMarket: market },
        wrapper: Wrapper,
      },
    )

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
    })
    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledOnce(),
    )

    const deMarket = { ...market, country: 'de', locale: 'de-DE' }
    rerender({ currentMarket: deMarket })

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'helpful' })
    })
    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledTimes(2),
    )

    await act(async () => {
      resolveUsVote({ ...review, currentVote: 'helpful' })
      await Promise.resolve()
    })

    act(() => {
      result.current.submitVote({ reviewId: review.id, vote: 'not_helpful' })
    })
    expect(server.voteOnProductReview).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveDeVote({ ...review, currentVote: 'helpful' })
      await Promise.resolve()
    })
  })

  it('does not let a cancelled reviews read overwrite a vote response', async () => {
    let resolveReviewsRead: (page: ProductReviewsPage) => void = () => undefined
    server.getProductReviewsPage.mockReturnValue(
      new Promise<ProductReviewsPage>((resolve) => {
        resolveReviewsRead = resolve
      }),
    )
    const votedReview = { ...review, currentVote: 'helpful' as const }
    server.voteOnProductReview.mockResolvedValue(votedReview)
    const query = {
      ...getDefaultProductReviewQuery('most_recent'),
      page: 2,
    }
    const { queryClient, Wrapper } = createHarness()
    const queryKey = [
      ...productReviewsQueryKey,
      market.country,
      market.locale,
      review.productId,
      query,
    ]
    queryClient.setQueryData(queryKey, initialPage, { updatedAt: 0 })
    const { result } = renderHook(
      () => ({
        reviews: useProductReviews({
          defaultSort: 'most_recent',
          initialPage,
          market,
          productId: review.productId,
          query,
        }),
        vote: useProductReviewVote({
          market,
          productId: review.productId,
        }),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() =>
      expect(server.getProductReviewsPage).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      await result.current.vote.mutateAsync({
        reviewId: review.id,
        vote: 'helpful',
      })
    })

    expect(queryClient.getQueryData(queryKey)).toEqual({
      ...initialPage,
      reviews: [votedReview, otherReview],
    })

    await act(async () => {
      resolveReviewsRead(initialPage)
      await Promise.resolve()
    })

    expect(queryClient.getQueryData(queryKey)).toEqual({
      ...initialPage,
      reviews: [votedReview, otherReview],
    })
  })

  it('clears the reviews projection when the customer session changes', async () => {
    const query = getDefaultProductReviewQuery('most_recent')
    const queryKey = [
      ...productReviewsQueryKey,
      market.country,
      market.locale,
      review.productId,
      query,
    ]
    const customerAReview = { ...review, currentVote: 'helpful' as const }
    const { queryClient, Wrapper } = createHarness()
    queryClient.setQueryData(queryKey, {
      ...initialPage,
      reviews: [customerAReview, otherReview],
    })
    server.loginCustomer.mockResolvedValue({ id: 'cust_customer_b' })

    const { result } = renderHook(() => useCustomerLogin({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({
        email: 'customer-b@example.com',
        password: 'password123',
      })
    })

    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })

  it('does not let a previous customer vote settle into the new reviews owner', async () => {
    let resolveVote: (value: ProductReview) => void = () => undefined
    server.voteOnProductReview.mockReturnValue(
      new Promise<ProductReview>((resolve) => {
        resolveVote = resolve
      }),
    )
    server.loginCustomer.mockResolvedValue({ id: 'cust_customer_b' })
    const { queryClient, Wrapper } = createHarness()
    const query = getDefaultProductReviewQuery('most_recent')
    const queryKey = [
      ...productReviewsQueryKey,
      market.country,
      market.locale,
      review.productId,
      query,
    ]
    const customerBPage = {
      ...initialPage,
      reviews: [review, otherReview],
    }

    const { result } = renderHook(
      () => ({
        login: useCustomerLogin({ market }),
        vote: useProductReviewVote({
          market,
          productId: review.productId,
        }),
      }),
      { wrapper: Wrapper },
    )

    let votePromise: Promise<ProductReview> | undefined
    act(() => {
      votePromise = result.current.vote.mutateAsync({
        reviewId: review.id,
        vote: 'helpful',
      })
    })
    await waitFor(() =>
      expect(server.voteOnProductReview).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      await result.current.login.mutateAsync({
        email: 'customer-b@example.com',
        password: 'password123',
      })
    })
    expect(result.current.vote.isPendingForReview(review.id)).toBe(false)
    queryClient.setQueryData(queryKey, customerBPage)

    await act(async () => {
      resolveVote({ ...review, currentVote: 'helpful' })
      await votePromise
    })

    expect(queryClient.getQueryData(queryKey)).toEqual(customerBPage)
    expect(result.current.vote.isPendingForReview(review.id)).toBe(false)
    expect(result.current.vote.hasErrorForReview(review.id)).toBe(false)
  })
})
