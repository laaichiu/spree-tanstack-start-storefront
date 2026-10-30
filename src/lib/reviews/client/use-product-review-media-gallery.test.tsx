import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as ReactStart from '@tanstack/react-start'

import { getDefaultProductReviewQuery } from '@/lib/reviews/contracts'
import type { ProductReview } from '@/lib/reviews/contracts'

import {
  clearProductReviewSessionState,
  productReviewMediaGalleryQueryKey,
} from './review-query'
import { useProductReviewMediaGallery } from './use-product-review-media-gallery'

const server = vi.hoisted(() => ({ getProductReviewMediaGallery: vi.fn() }))

vi.mock('../api/product-reviews.functions', () => ({
  getProductReviewMediaGallery: server.getProductReviewMediaGallery,
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
  body: 'Photo review',
  createdAt: '2026-10-29T00:00:00.000Z',
  currentVote: null,
  helpfulCount: 0,
  id: 'rev_photo',
  media: [],
  notHelpfulCount: 0,
  productId: 'prod_product',
  purchasedOptionValues: [],
  rating: 5,
  reviewerName: null,
  title: 'Photo review',
  variantId: null,
  verifiedPurchase: false,
} satisfies ProductReview

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('useProductReviewMediaGallery', () => {
  it('loads the product photo gallery only when it is opened', async () => {
    server.getProductReviewMediaGallery.mockResolvedValue([review])
    const { Wrapper } = createHarness()
    const query = {
      ...getDefaultProductReviewQuery('most_recent'),
      page: 3,
      ratings: ['5'],
    }
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useProductReviewMediaGallery({
          enabled,
          market,
          productId: 'prod_product',
          query,
        }),
      { initialProps: { enabled: false }, wrapper: Wrapper },
    )

    expect(server.getProductReviewMediaGallery).not.toHaveBeenCalled()

    rerender({ enabled: true })

    await waitFor(() => expect(result.current.data).toEqual([review]))
    expect(server.getProductReviewMediaGallery).toHaveBeenCalledWith({
      data: {
        market: { country: 'us', locale: 'en' },
        productId: 'prod_product',
        query: { ...query, page: 1, withImages: true },
      },
    })
  })

  it('scopes cached photo reviews to the active review session', async () => {
    server.getProductReviewMediaGallery.mockResolvedValue([review])
    const { queryClient, Wrapper } = createHarness()
    const query = getDefaultProductReviewQuery('most_recent')
    const { result } = renderHook(
      () =>
        useProductReviewMediaGallery({
          enabled: true,
          market,
          productId: 'prod_product',
          query,
        }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.data).toEqual([review]))
    const getGalleryQueryKeys = () =>
      queryClient
        .getQueryCache()
        .findAll({ queryKey: productReviewMediaGalleryQueryKey })
        .map(({ queryKey: key }) => key)
    const previousQueryKeys = getGalleryQueryKeys()
    expect(previousQueryKeys).toHaveLength(1)

    act(() => clearProductReviewSessionState(queryClient))

    await waitFor(() =>
      expect(server.getProductReviewMediaGallery).toHaveBeenCalledTimes(2),
    )
    const nextQueryKeys = getGalleryQueryKeys()

    expect(nextQueryKeys).toHaveLength(1)
    expect(nextQueryKeys).not.toEqual(previousQueryKeys)
  })
})
