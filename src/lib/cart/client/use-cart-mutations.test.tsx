import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import { baseCart } from '../mappers/cart.mapper.fixture'
import { getCartQueryKey } from './cart-query'
import {
  useAddToCart,
  useRemoveCartItem,
  useResetCartSession,
  useUpdateCartItem,
} from './use-cart-mutations'
import { useCart } from './use-cart-query'

const server = vi.hoisted(() => ({
  addToCart: vi.fn(),
  getCart: vi.fn(),
  removeCartItem: vi.fn(),
  resetCartSession: vi.fn(),
  updateCartItem: vi.fn(),
}))

vi.mock('../api/cart-item.functions', () => ({
  addToCart: server.addToCart,
  removeCartItem: server.removeCartItem,
  updateCartItem: server.updateCartItem,
}))

vi.mock('../api/cart-read.functions', () => ({
  getCart: server.getCart,
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

  return { queryClient, Wrapper }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('cart mutations', () => {
  it('serializes item mutations for the same market across mutation types', async () => {
    let resolveFirstMutation: (nextCart: typeof cart) => void = () => undefined
    const firstMutation = new Promise<typeof cart>((resolve) => {
      resolveFirstMutation = resolve
    })
    const updatedCart = { ...cart, itemCount: 3 }
    server.updateCartItem.mockReturnValueOnce(firstMutation)
    server.removeCartItem.mockResolvedValue(updatedCart)
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        remove: useRemoveCartItem({ market }),
        update: useUpdateCartItem({ market }),
      }),
      { wrapper: Wrapper },
    )

    let firstPromise: Promise<unknown> | undefined
    let secondPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current.update.mutateAsync({
        lineItemId: 'line-1',
        quantity: 3,
      })
      secondPromise = result.current.remove.mutateAsync({
        lineItemId: 'line-2',
      })
    })

    expect(server.removeCartItem).not.toHaveBeenCalled()

    await act(async () => {
      resolveFirstMutation(updatedCart)
      await firstPromise
      await secondPromise
    })

    expect(server.removeCartItem).toHaveBeenCalledWith({
      data: {
        lineItemId: 'line-2',
        market: { country: 'us', locale: 'en' },
      },
    })
  })

  it('adds a variant with minimal verified-market input and synchronizes both cart query identities', async () => {
    server.addToCart.mockResolvedValue(cart)
    const { queryClient, Wrapper } = createHarness()
    const { result } = renderHook(() => useAddToCart({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ quantity: 2, variantId: 'variant-1' })
    })

    expect(server.addToCart).toHaveBeenCalledWith({
      data: {
        market: { country: 'us', locale: 'en' },
        quantity: 2,
        variantId: 'variant-1',
      },
    })
    expect(
      queryClient.getQueryData(
        getCartQueryKey({ country: 'us', locale: 'en' }),
      ),
    ).toEqual(cart)
    expect(
      queryClient.getQueryData(
        getCartQueryKey({
          cartId: cart.id,
          country: 'us',
          locale: 'en',
        }),
      ),
    ).toEqual(cart)
  })

  it('hands over the shared cart query when add-to-cart replaces the verified owner', async () => {
    const previousCart = { ...cart, id: 'cart-expired' }
    const replacementCart = { ...cart, id: 'cart-new' }
    server.addToCart.mockResolvedValue(replacementCart)
    const { queryClient, Wrapper } = createHarness()
    queryClient.setQueryData(
      getCartQueryKey({ country: 'us', locale: 'en' }),
      previousCart,
    )
    const { result } = renderHook(() => useAddToCart({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ quantity: 1, variantId: 'variant-1' })
    })

    expect(
      queryClient.getQueryData(
        getCartQueryKey({ country: 'us', locale: 'en' }),
      ),
    ).toEqual(replacementCart)
  })

  it('does not let a late add-to-cart response replace a newer shared owner', async () => {
    let resolveAddToCart: (nextCart: typeof cart) => void = () => undefined
    server.addToCart.mockReturnValue(
      new Promise<typeof cart>((resolve) => {
        resolveAddToCart = resolve
      }),
    )
    const previousCart = { ...cart, id: 'cart-expired' }
    const newerCart = { ...cart, id: 'cart-newer' }
    const lateCart = { ...cart, id: 'cart-late' }
    const { queryClient, Wrapper } = createHarness()
    const activeCartKey = getCartQueryKey({ country: 'us', locale: 'en' })
    queryClient.setQueryData(activeCartKey, previousCart)
    const { result } = renderHook(() => useAddToCart({ market }), {
      wrapper: Wrapper,
    })

    let mutationPromise: Promise<unknown> | undefined
    act(() => {
      mutationPromise = result.current.mutateAsync({
        quantity: 1,
        variantId: 'variant-1',
      })
    })
    queryClient.setQueryData(activeCartKey, newerCart)

    await act(async () => {
      resolveAddToCart(lateCart)
      await mutationPromise
    })

    expect(queryClient.getQueryData(activeCartKey)).toEqual(newerCart)
  })

  it('does not let an in-flight cart read overwrite a mutation response', async () => {
    let resolveCartRead: (nextCart: typeof cart) => void = () => undefined
    server.getCart.mockReturnValue(
      new Promise<typeof cart>((resolve) => {
        resolveCartRead = resolve
      }),
    )
    const previousCart = { ...cart, itemCount: 1 }
    const updatedCart = { ...cart, itemCount: 3 }
    server.updateCartItem.mockResolvedValue(updatedCart)
    const { queryClient, Wrapper } = createHarness()
    const activeCartKey = getCartQueryKey({ country: 'us', locale: 'en' })
    const { result } = renderHook(
      () => ({
        cart: useCart({
          initialCart: previousCart,
          market,
          refetchOnMount: 'always',
        }),
        update: useUpdateCartItem({ market }),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(server.getCart).toHaveBeenCalledOnce())

    await act(async () => {
      await result.current.update.mutateAsync({
        lineItemId: 'line-1',
        quantity: 3,
      })
    })

    expect(queryClient.getQueryData(activeCartKey)).toEqual(updatedCart)

    await act(async () => {
      resolveCartRead(previousCart)
      await Promise.resolve()
    })

    expect(queryClient.getQueryData(activeCartKey)).toEqual(updatedCart)
  })

  it('keeps a late cart mutation response in its request market cache', async () => {
    let resolveUpdate: (nextCart: typeof cart) => void = () => undefined
    const update = new Promise<typeof cart>((resolve) => {
      resolveUpdate = resolve
    })
    server.updateCartItem.mockReturnValueOnce(update)
    const { queryClient, Wrapper } = createHarness()
    const usMarket = market
    const deMarket = {
      ...market,
      country: 'de',
      currencyCode: 'EUR',
      locale: 'de',
      marketId: 'market-de',
      marketName: 'Germany',
    }
    const usCart = { ...cart, id: 'cart-us' }
    const staleResponse = { ...usCart, itemCount: 4 }
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useUpdateCartItem({ market: currentMarket }),
      {
        initialProps: { currentMarket: usMarket },
        wrapper: Wrapper,
      },
    )

    let updatePromise: Promise<unknown> | undefined
    act(() => {
      updatePromise = result.current.mutateAsync({
        lineItemId: 'line-1',
        quantity: 4,
      })
    })
    await waitFor(() => expect(server.updateCartItem).toHaveBeenCalledOnce())

    rerender({ currentMarket: deMarket })

    await act(async () => {
      resolveUpdate(staleResponse)
      await updatePromise
    })

    expect(server.updateCartItem).toHaveBeenCalledWith({
      data: {
        lineItemId: 'line-1',
        market: { country: 'us', locale: 'en' },
        quantity: 4,
      },
    })
    expect(
      queryClient.getQueryData(
        getCartQueryKey({ country: 'us', locale: 'en' }),
      ),
    ).toEqual(staleResponse)
    expect(
      queryClient.getQueryData(
        getCartQueryKey({ country: deMarket.country, locale: deMarket.locale }),
      ),
    ).toBeUndefined()
  })

  it('updates quantity and replaces active cart query data with the Spree response', async () => {
    const updatedCart = { ...cart, itemCount: 3 }
    server.updateCartItem.mockResolvedValue(updatedCart)
    const { queryClient, Wrapper } = createHarness()
    const { result } = renderHook(() => useUpdateCartItem({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ lineItemId: 'line-1', quantity: 3 })
    })

    expect(server.updateCartItem).toHaveBeenCalledWith({
      data: {
        lineItemId: 'line-1',
        market: { country: 'us', locale: 'en' },
        quantity: 3,
      },
    })
    expect(
      queryClient.getQueryData(
        getCartQueryKey({ country: 'us', locale: 'en' }),
      ),
    ).toEqual(updatedCart)
  })

  it('removes a line item and keeps another market cache isolated', async () => {
    const updatedCart = { ...cart, itemCount: 0, items: [] }
    server.removeCartItem.mockResolvedValue(updatedCart)
    const { queryClient, Wrapper } = createHarness()
    const otherMarketKey = getCartQueryKey({ country: 'ca', locale: 'en' })
    const otherMarketCart = { ...cart, id: 'cart-ca' }
    queryClient.setQueryData(otherMarketKey, otherMarketCart)
    const { result } = renderHook(() => useRemoveCartItem({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ lineItemId: 'line-1' })
    })

    expect(server.removeCartItem).toHaveBeenCalledWith({
      data: {
        lineItemId: 'line-1',
        market: { country: 'us', locale: 'en' },
      },
    })
    expect(queryClient.getQueryData(otherMarketKey)).toEqual(otherMarketCart)
  })

  it('serializes a cart session reset behind an active item mutation', async () => {
    let resolveItemMutation: (nextCart: typeof cart) => void = () => undefined
    const itemMutation = new Promise<typeof cart>((resolve) => {
      resolveItemMutation = resolve
    })
    server.updateCartItem.mockReturnValueOnce(itemMutation)
    server.resetCartSession.mockResolvedValue(undefined)
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        reset: useResetCartSession({ market }),
        update: useUpdateCartItem({ market }),
      }),
      { wrapper: Wrapper },
    )

    let itemPromise: Promise<unknown> | undefined
    let resetPromise: Promise<unknown> | undefined
    act(() => {
      itemPromise = result.current.update.mutateAsync({
        lineItemId: 'line-1',
        quantity: 2,
      })
      resetPromise = result.current.reset.mutateAsync()
    })

    expect(server.resetCartSession).not.toHaveBeenCalled()

    await act(async () => {
      resolveItemMutation(cart)
      await itemPromise
      await resetPromise
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()
  })

  it('invalidates all cart identities after resetting the httpOnly cart session', async () => {
    server.resetCartSession.mockResolvedValue(undefined)
    const { queryClient, Wrapper } = createHarness()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useResetCartSession({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cart'] })
  })

  it('deduplicates cart-session resets across mounted mutation observers', async () => {
    let resolveReset: (value: undefined) => void = () => undefined
    server.resetCartSession.mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        resolveReset = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        first: useResetCartSession({ market }),
        second: useResetCartSession({ market }),
      }),
      { wrapper: Wrapper },
    )

    let firstReset: Promise<unknown> | undefined
    let secondReset: Promise<unknown> | undefined
    act(() => {
      firstReset = result.current.first.mutateAsync()
    })

    await waitFor(() => expect(server.resetCartSession).toHaveBeenCalledOnce())

    act(() => {
      secondReset = result.current.second.mutateAsync()
    })

    await act(async () => {
      resolveReset(undefined)
      await firstReset
      await secondReset
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()
    await expect(secondReset).resolves.toBeNull()
  })

  it('keeps cart-session reset successful when query invalidation fails', async () => {
    const invalidationError = new Error('cart refresh failed')
    server.resetCartSession.mockResolvedValue(undefined)
    const { queryClient, Wrapper } = createHarness()
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(
      invalidationError,
    )
    const { result } = renderHook(() => useResetCartSession({ market }), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await expect(result.current.mutateAsync()).resolves.toBeUndefined()
    })

    expect(server.resetCartSession).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })
})
