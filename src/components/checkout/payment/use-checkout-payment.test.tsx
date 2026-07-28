import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { useCompleteCheckoutOrder } from './use-checkout-payment'

const completeCheckoutOrderFn = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()

  return {
    ...actual,
    useServerFn: () => completeCheckoutOrderFn,
  }
})

afterEach(() => {
  cleanup()
  completeCheckoutOrderFn.mockReset()
})

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
          {children}
        </MarketProvider>
      </QueryClientProvider>
    )
  }
}

describe('useCompleteCheckoutOrder', () => {
  it('returns the completion result before cart refresh settles', async () => {
    const queryClient = new QueryClient()
    const invalidateDeferred = createDeferred<void>()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(invalidateDeferred.promise)
    const completedOrder = {
      id: 'or_123',
      success: true,
    }
    completeCheckoutOrderFn.mockResolvedValueOnce(completedOrder)

    const { result } = renderHook(
      () => useCompleteCheckoutOrder({ cartId: 'cart_123' }),
      { wrapper: createWrapper(queryClient) },
    )

    let completionPromise!: ReturnType<typeof result.current.mutateAsync>

    await act(async () => {
      completionPromise = result.current.mutateAsync({})
    })

    const completion = await Promise.race([
      completionPromise,
      new Promise<typeof completedOrder>((resolve) => {
        setTimeout(() => resolve({ id: 'timed_out', success: false }), 100)
      }),
    ])

    expect(completion).toEqual(completedOrder)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cart'],
    })

    invalidateDeferred.resolve()
    await completionPromise
    queryClient.clear()
  })
})
