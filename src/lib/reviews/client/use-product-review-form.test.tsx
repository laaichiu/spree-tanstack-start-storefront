import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useProductReviewForm } from './use-product-review-form'

import {
  clearProductReviewSessionState,
  getProductReviewFormQueryKey,
} from './review-query'

const server = vi.hoisted(() => ({
  getForm: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: () => server.getForm,
}))

vi.mock('../api/customer-reviews.functions', () => ({
  getCustomerProductReviewForm: 'get-product-review-form',
}))

const item = { productId: 'prod_shirt', variantId: 'variant_shirt' }
const market = { country: 'us', locale: 'en' }

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { Wrapper, queryClient }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('product review form customer boundary', () => {
  it('does not reuse a form projection across customers', async () => {
    server.getForm
      .mockResolvedValueOnce({ customer: 'first' })
      .mockResolvedValueOnce({ customer: 'second' })
    const { Wrapper } = createHarness()

    const first = renderHook(
      () =>
        useProductReviewForm({
          customerId: 'cust_first',
          item,
          market,
          orderId: 'or_order',
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() =>
      expect(first.result.current.data).toEqual({ customer: 'first' }),
    )

    const second = renderHook(
      () =>
        useProductReviewForm({
          customerId: 'cust_second',
          item,
          market,
          orderId: 'or_order',
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() =>
      expect(second.result.current.data).toEqual({ customer: 'second' }),
    )

    expect(server.getForm).toHaveBeenCalledTimes(2)
  })

  it('loads a fresh form after a session transition and ignores the previous in-flight response', async () => {
    let resolveOld: (value: unknown) => void = () => undefined
    server.getForm
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve
        }),
      )
      .mockResolvedValueOnce({ eligibility: 'current-session' })
    const { Wrapper, queryClient } = createHarness()
    const form = renderHook(
      () =>
        useProductReviewForm({
          customerId: 'cust_customer',
          item,
          market,
          orderId: 'or_order',
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(server.getForm).toHaveBeenCalledOnce())
    act(() => clearProductReviewSessionState(queryClient))
    await waitFor(() =>
      expect(form.result.current.data).toEqual({
        eligibility: 'current-session',
      }),
    )
    await act(async () => {
      resolveOld({ eligibility: 'old-session' })
      await Promise.resolve()
    })
    expect(form.result.current.data).toEqual({ eligibility: 'current-session' })
    expect(server.getForm).toHaveBeenCalledTimes(2)
    form.unmount()
    queryClient.clear()
  })

  it('keeps the cache keys distinct for different customers', () => {
    const firstKey = getProductReviewFormQueryKey({
      customerId: 'cust_first',
      item,
      market,
      orderId: 'or_order',
      sessionGeneration: 0,
    })
    const secondKey = getProductReviewFormQueryKey({
      customerId: 'cust_second',
      item,
      market,
      orderId: 'or_order',
      sessionGeneration: 0,
    })

    expect(firstKey).not.toEqual(secondKey)
  })
})
