import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
} from './use-checkout-order'
import { useResetCheckoutSession } from './use-checkout-session-reset'
import { getCartMutationKey } from '../../cart/client/cart-mutation'

const market = { country: 'us', locale: 'en' }

const resetCartSession = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
}))

vi.mock('../../cart/client/use-cart-mutations', () => ({
  useResetCartSession: () => resetCartSession,
}))

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
  resetCartSession.mutateAsync.mockReset()
})

describe('checkout session reset', () => {
  it('removes checkout order and snapshot projections after the cart session reset succeeds', async () => {
    resetCartSession.mutateAsync.mockResolvedValue({ success: true })
    const { queryClient, Wrapper } = createHarness()
    const checkoutOrderKey = [
      ...checkoutOrderQueryKey,
      'us',
      'en',
      'cart_checkout',
    ]
    const snapshotKey = [
      ...checkoutOrderSnapshotQueryKey,
      'us',
      'en',
      'cart_checkout',
    ]
    const order = { id: 'cart_checkout', itemCount: 1 }
    const snapshot = { id: 'cart_checkout', itemCount: 2 }
    queryClient.setQueryData(checkoutOrderKey, order)
    queryClient.setQueryData(snapshotKey, snapshot)
    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(resetCartSession.mutateAsync).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(checkoutOrderKey)).toBeUndefined()
    expect(queryClient.getQueryData(snapshotKey)).toBeUndefined()
  })

  it('keeps checkout projections when the cart session reset fails', async () => {
    const failure = new Error('reset failed')
    resetCartSession.mutateAsync.mockRejectedValue(failure)
    const { queryClient, Wrapper } = createHarness()
    const checkoutOrderKey = [
      ...checkoutOrderQueryKey,
      'us',
      'en',
      'cart_checkout',
    ]
    const order = { id: 'cart_checkout', itemCount: 1 }
    queryClient.setQueryData(checkoutOrderKey, order)
    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    await expect(
      act(async () => {
        await result.current.mutateAsync()
      }),
    ).rejects.toBe(failure)

    expect(queryClient.getQueryData(checkoutOrderKey)).toEqual(order)
  })

  it('ignores a duplicate checkout-session reset while the first reset is in flight', async () => {
    let resolveReset: (value: { success: boolean }) => void = () => undefined
    resetCartSession.mutateAsync.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveReset = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    let firstReset: Promise<unknown> | undefined
    act(() => {
      firstReset = result.current.mutateAsync()
      void result.current.mutateAsync()
    })

    expect(resetCartSession.mutateAsync).toHaveBeenCalledOnce()
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveReset({ success: true })
      await firstReset
    })

    expect(resetCartSession.mutateAsync).toHaveBeenCalledOnce()
    expect(result.current.isPending).toBe(false)
  })

  it('returns no navigation result for a duplicate checkout-session reset', async () => {
    let resolveReset: (value: { success: boolean }) => void = () => undefined
    resetCartSession.mutateAsync.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveReset = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    let firstReset: Promise<unknown> | undefined
    let duplicateResult: unknown
    act(() => {
      firstReset = result.current.mutateAsync()
    })
    await act(async () => {
      duplicateResult = await result.current.mutateAsync()
    })

    expect(duplicateResult).toBeNull()
    resolveReset({ success: true })
    await act(async () => {
      await firstReset
    })
  })

  it('does not clear checkout projections when the Cart reset is already pending', async () => {
    resetCartSession.mutateAsync.mockResolvedValue(null)
    const { queryClient, Wrapper } = createHarness()
    const checkoutOrderKey = [...checkoutOrderQueryKey, 'us', 'en', 'cart_us']
    queryClient.setQueryData(checkoutOrderKey, { id: 'cart_us' })
    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(result.current.mutateAsync()).resolves.toBeNull()
    })

    expect(queryClient.getQueryData(checkoutOrderKey)).toEqual({
      id: 'cart_us',
    })
  })

  it('does not drop recovery while an older Cart mutation is pending', async () => {
    let resolveCartMutation: () => void = () => undefined
    const cartMutation = new Promise<void>((resolve) => {
      resolveCartMutation = resolve
    })
    resetCartSession.mutateAsync.mockResolvedValue({ success: true })
    const { queryClient, Wrapper } = createHarness()
    const { result: cartMutationResult } = renderHook(
      () =>
        useMutation({
          mutationKey: getCartMutationKey(market),
          mutationFn: (_variables: { requestCartId: string }) => cartMutation,
        }),
      { wrapper: Wrapper },
    )

    act(() => {
      void cartMutationResult.current.mutateAsync({
        requestCartId: 'cart-old',
      })
    })
    await waitFor(() => {
      expect(
        queryClient.isMutating({ mutationKey: getCartMutationKey(market) }),
      ).toBe(1)
    })

    const { result } = renderHook(() => useResetCheckoutSession({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(result.current.mutateAsync()).resolves.toEqual({
        success: true,
      })
    })

    expect(resetCartSession.mutateAsync).toHaveBeenCalledOnce()

    await act(async () => {
      resolveCartMutation()
      await Promise.resolve()
    })
  })

  it('isolates a new market reset from an older reset cleanup', async () => {
    let resolveFirstReset: (value: { success: boolean }) => void = () =>
      undefined
    let resolveSecondReset: (value: { success: boolean }) => void = () =>
      undefined
    resetCartSession.mutateAsync
      .mockReturnValueOnce(
        new Promise<{ success: boolean }>((resolve) => {
          resolveFirstReset = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<{ success: boolean }>((resolve) => {
          resolveSecondReset = resolve
        }),
      )
    const { queryClient, Wrapper } = createHarness()
    const usOrderKey = [...checkoutOrderQueryKey, 'us', 'en', 'cart_us']
    const deOrderKey = [...checkoutOrderQueryKey, 'de', 'de', 'cart_de']
    queryClient.setQueryData(usOrderKey, { id: 'cart_us' })
    queryClient.setQueryData(deOrderKey, { id: 'cart_de' })
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useResetCheckoutSession({ market: currentMarket }),
      {
        initialProps: { currentMarket: market },
        wrapper: Wrapper,
      },
    )

    let firstReset: Promise<unknown> | undefined
    act(() => {
      firstReset = result.current.mutateAsync()
    })

    rerender({ currentMarket: { country: 'de', locale: 'de' } })

    let secondReset: Promise<unknown> | undefined
    act(() => {
      secondReset = result.current.mutateAsync()
    })

    expect(resetCartSession.mutateAsync).toHaveBeenCalledTimes(2)
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveFirstReset({ success: true })
      await firstReset
    })

    expect(queryClient.getQueryData(usOrderKey)).toBeUndefined()
    expect(queryClient.getQueryData(deOrderKey)).toEqual({ id: 'cart_de' })
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveSecondReset({ success: true })
      await secondReset
    })

    expect(queryClient.getQueryData(deOrderKey)).toBeUndefined()
    expect(result.current.isPending).toBe(false)
  })
})
