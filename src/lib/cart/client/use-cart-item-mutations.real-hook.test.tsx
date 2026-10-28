import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import { baseCart } from '../mappers/cart.mapper.fixture'
import { useCartItemMutations } from './use-cart-item-mutations'

const server = vi.hoisted(() => ({
  removeCartItem: vi.fn(),
  resetCartSession: vi.fn(),
  updateCartItem: vi.fn(),
}))

vi.mock('../api/cart-item.functions', () => ({
  removeCartItem: server.removeCartItem,
  updateCartItem: server.updateCartItem,
}))

vi.mock('../api/cart-session.functions', () => ({
  resetCartSession: server.resetCartSession,
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}
const cart = mapSpreeCartToSummary(baseCart)

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

describe('useCartItemMutations with real cart mutation hooks', () => {
  it('allows the new cart owner to queue an item mutation behind the old owner', async () => {
    let resolveFirstMutation: (value: typeof cart) => void = () => undefined
    const firstMutation = new Promise<typeof cart>((resolve) => {
      resolveFirstMutation = resolve
    })
    server.updateCartItem
      .mockReturnValueOnce(firstMutation)
      .mockResolvedValueOnce(cart)

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

    await waitFor(() => expect(server.updateCartItem).toHaveBeenCalledOnce())

    rerender({ cartId: 'cart-2' })

    let secondPromise: Promise<void> | undefined
    act(() => {
      secondPromise = result.current.updateQuantity('line-2', 3)
    })

    expect(server.updateCartItem).toHaveBeenCalledOnce()

    await act(async () => {
      resolveFirstMutation(cart)
      await firstPromise
    })

    await waitFor(() => expect(server.updateCartItem).toHaveBeenCalledTimes(2))

    await act(async () => {
      await secondPromise
    })
  })

  it('keeps a global cart-session reset pending for every cart owner', async () => {
    let resolveReset: (value: { success: true }) => void = () => undefined
    server.resetCartSession.mockReturnValueOnce(
      new Promise<{ success: true }>((resolve) => {
        resolveReset = resolve
      }),
    )

    const { result } = renderHook(
      () =>
        useCartItemMutations({
          cartId: 'cart-1',
          errorMessage: 'Cart reset failed.',
          market,
        }),
      { wrapper: createHarness() },
    )

    let resetPromise: Promise<void> | undefined
    act(() => {
      resetPromise = result.current.recoverCartSession()
    })

    await waitFor(() => expect(server.resetCartSession).toHaveBeenCalledOnce())
    expect(result.current.isCartMutationPending).toBe(true)

    await act(async () => {
      resolveReset({ success: true })
      await resetPromise
    })
  })

  it('ignores a same-tick item mutation from another observer', async () => {
    let resolveFirstMutation: (value: typeof cart) => void = () => undefined
    const firstMutation = new Promise<typeof cart>((resolve) => {
      resolveFirstMutation = resolve
    })
    server.updateCartItem
      .mockReturnValueOnce(firstMutation)
      .mockResolvedValueOnce(cart)

    const { result } = renderHook(
      () => ({
        first: useCartItemMutations({
          cartId: 'cart-1',
          errorMessage: 'Cart update failed.',
          market,
        }),
        second: useCartItemMutations({
          cartId: 'cart-1',
          errorMessage: 'Cart update failed.',
          market,
        }),
      }),
      { wrapper: createHarness() },
    )

    let firstPromise: Promise<void> | undefined
    act(() => {
      firstPromise = result.current.first.updateQuantity('line-1', 2)
      void result.current.second.updateQuantity('line-1', 2)
    })

    await waitFor(() => expect(server.updateCartItem).toHaveBeenCalledOnce())

    await act(async () => {
      resolveFirstMutation(cart)
      await firstPromise
      await waitFor(() =>
        expect(result.current.first.isCartMutationPending).toBe(false),
      )
    })

    expect(server.updateCartItem).toHaveBeenCalledOnce()
  })
})
