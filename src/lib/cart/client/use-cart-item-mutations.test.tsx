import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCartItemMutations } from './use-cart-item-mutations'

const server = vi.hoisted(() => ({
  removeCartItem: vi.fn(),
  resetCartSession: vi.fn(),
  updateCartItem: vi.fn(),
}))

vi.mock('./use-cart-mutations', () => ({
  useRemoveCartItem: () => ({ mutateAsync: server.removeCartItem }),
  useResetCartSession: () => ({
    isPending: false,
    mutateAsync: server.resetCartSession,
  }),
  useUpdateCartItem: () => ({ mutateAsync: server.updateCartItem }),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}

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

  return Wrapper
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCartItemMutations', () => {
  it('blocks a second item mutation while the cart mutation is pending', async () => {
    let resolveFirstMutation: () => void = () => undefined
    const firstMutation = new Promise<void>((resolve) => {
      resolveFirstMutation = resolve
    })
    server.updateCartItem.mockReturnValueOnce(firstMutation)
    const { result } = renderHook(
      () =>
        useCartItemMutations({
          errorMessage: 'Cart update failed.',
          market,
        }),
      { wrapper: createHarness() },
    )

    let firstPromise: Promise<void> | undefined
    act(() => {
      firstPromise = result.current.updateQuantity('line-1', 2)
    })

    expect(result.current.isCartMutationPending).toBe(true)

    await act(async () => {
      await result.current.removeItem('line-2')
    })

    expect(server.removeCartItem).not.toHaveBeenCalled()

    await act(async () => {
      resolveFirstMutation()
      await firstPromise
    })

    expect(result.current.isCartMutationPending).toBe(false)
  })

  it('rethrows failed quantity updates for selector rollback', async () => {
    server.updateCartItem.mockRejectedValueOnce(new Error('Inventory changed'))
    const { result } = renderHook(
      () =>
        useCartItemMutations({
          errorMessage: 'Cart update failed.',
          market,
        }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(result.current.updateQuantity('line-1', 6)).rejects.toThrow(
        'Inventory changed',
      )
    })

    expect(result.current.cartMutationError).toBe('Inventory changed')
    expect(result.current.isCartMutationPending).toBe(false)
  })

  it('does not let an old cart failure clear the new cart mutation owner', async () => {
    let rejectFirstMutation: (error: Error) => void = () => undefined
    let resolveSecondMutation: () => void = () => undefined
    const firstMutation = new Promise<void>((_, reject) => {
      rejectFirstMutation = reject
    })
    const secondMutation = new Promise<void>((resolve) => {
      resolveSecondMutation = resolve
    })
    const failure = new Error('old cart update failed')
    server.updateCartItem
      .mockReturnValueOnce(firstMutation)
      .mockReturnValueOnce(secondMutation)
    const { result, rerender } = renderHook(
      ({ cartId }: { cartId: string }) =>
        useCartItemMutations({
          cartId,
          errorMessage: 'Cart update failed.',
          market,
        }),
      {
        initialProps: { cartId: 'cart-1' },
        wrapper: createHarness(),
      },
    )

    let firstPromise: Promise<void> | undefined
    act(() => {
      firstPromise = result.current.updateQuantity('line-1', 2)
    })

    rerender({ cartId: 'cart-2' })

    let secondPromise: Promise<void> | undefined
    act(() => {
      secondPromise = result.current.updateQuantity('line-2', 3)
    })

    await act(async () => {
      rejectFirstMutation(failure)
      await expect(firstPromise).rejects.toBe(failure)
    })

    expect(result.current.cartMutationError).toBeNull()
    expect(result.current.isCartMutationPending).toBe(true)

    await act(async () => {
      resolveSecondMutation()
      await secondPromise
    })

    expect(result.current.isCartMutationPending).toBe(false)
  })

  it('ignores a duplicate cart-session recovery while reset is in flight', async () => {
    let resolveReset: () => void = () => undefined
    server.resetCartSession.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveReset = resolve
      }),
    )
    const { result } = renderHook(
      () =>
        useCartItemMutations({
          errorMessage: 'Cart reset failed.',
          market,
        }),
      { wrapper: createHarness() },
    )

    let firstRecovery: Promise<void> | undefined
    act(() => {
      firstRecovery = result.current.recoverCartSession()
      void result.current.recoverCartSession()
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()

    await act(async () => {
      resolveReset()
      await firstRecovery
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()
  })

  it('releases the cart-session recovery guard after a failed reset', async () => {
    server.resetCartSession
      .mockRejectedValueOnce(new Error('reset failed'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(
      () =>
        useCartItemMutations({
          errorMessage: 'Cart reset failed.',
          market,
        }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await result.current.recoverCartSession()
    })
    expect(result.current.cartMutationError).toBe('reset failed')

    await act(async () => {
      await result.current.recoverCartSession()
    })

    expect(server.resetCartSession).toHaveBeenCalledTimes(2)
    expect(result.current.cartMutationError).toBeNull()
  })

  it('does not let an old reset failure write into the new cart context', async () => {
    let rejectFirstReset: (error: Error) => void = () => undefined
    let resolveSecondReset: () => void = () => undefined
    const firstReset = new Promise<void>((_, reject) => {
      rejectFirstReset = reject
    })
    const secondReset = new Promise<void>((resolve) => {
      resolveSecondReset = resolve
    })
    const failure = new Error('old cart reset failed')
    server.resetCartSession
      .mockReturnValueOnce(firstReset)
      .mockReturnValueOnce(secondReset)
    const { result, rerender } = renderHook(
      ({ cartId }: { cartId: string }) =>
        useCartItemMutations({
          cartId,
          errorMessage: 'Cart reset failed.',
          market,
        }),
      {
        initialProps: { cartId: 'cart-1' },
        wrapper: createHarness(),
      },
    )

    let firstRecovery: Promise<void> | undefined
    act(() => {
      firstRecovery = result.current.recoverCartSession()
    })

    rerender({ cartId: 'cart-2' })

    let secondRecovery: Promise<void> | undefined
    act(() => {
      secondRecovery = result.current.recoverCartSession()
    })

    await act(async () => {
      rejectFirstReset(failure)
      await firstRecovery
    })

    expect(result.current.cartMutationError).toBeNull()

    await act(async () => {
      await result.current.recoverCartSession()
    })

    expect(server.resetCartSession).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecondReset()
      await secondRecovery
    })

    expect(result.current.cartMutationError).toBeNull()
  })

  it('does not expose an old reset pending state to a new cart owner', async () => {
    let resolveFirstReset: () => void = () => undefined
    let resolveSecondReset: () => void = () => undefined
    const firstReset = new Promise<void>((resolve) => {
      resolveFirstReset = resolve
    })
    const secondReset = new Promise<void>((resolve) => {
      resolveSecondReset = resolve
    })
    server.resetCartSession
      .mockReturnValueOnce(firstReset)
      .mockReturnValueOnce(secondReset)
    const { result, rerender } = renderHook(
      ({ cartId }: { cartId: string }) =>
        useCartItemMutations({
          cartId,
          errorMessage: 'Cart reset failed.',
          market,
        }),
      {
        initialProps: { cartId: 'cart-1' },
        wrapper: createHarness(),
      },
    )

    let firstRecovery: Promise<void> | undefined
    act(() => {
      firstRecovery = result.current.recoverCartSession()
    })
    expect(result.current.isResetPending).toBe(true)

    rerender({ cartId: 'cart-2' })
    expect(result.current.isResetPending).toBe(false)

    let secondRecovery: Promise<void> | undefined
    act(() => {
      secondRecovery = result.current.recoverCartSession()
    })
    expect(result.current.isResetPending).toBe(true)

    await act(async () => {
      resolveFirstReset()
      await firstRecovery
    })
    expect(result.current.isResetPending).toBe(true)

    await act(async () => {
      resolveSecondReset()
      await secondRecovery
    })
    expect(result.current.isResetPending).toBe(false)
  })
})
