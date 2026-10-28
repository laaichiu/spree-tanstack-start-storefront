import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cartQueryKey } from '@/lib/cart/client/cart-query'
import {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
} from '@/lib/checkout/client/use-checkout-order'

import { logoutCustomer } from '../api/customer-session.functions'
import { useCustomerLogout } from './use-customer-logout'
import { useCustomerSignOutController } from './use-customer-sign-out-controller'

vi.mock('../api/customer-session.functions', () => ({
  logoutCustomer: vi.fn(),
}))

const logout = vi.mocked(logoutCustomer)
const market = { country: 'us', locale: 'en' }
const customer = { id: 'cust_ada' }

vi.mock('./account-session-provider', () => ({
  useAccountSession: () => customer,
}))

function createHarness(queryClient: QueryClient) {
  return function Harness({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('customer logout query cleanup', () => {
  it('removes cart and checkout state before notifying the signed-out owner', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })
    const cart = { id: 'cart_customer' }
    const checkout = { id: 'cart_customer' }
    const snapshot = { id: 'cart_customer' }
    const onLoggedOut = vi.fn(async () => {
      expect(queryClient.getQueryData([...cartQueryKey, 'us', 'en'])).toBe(
        undefined,
      )
      expect(
        queryClient.getQueryData([
          ...checkoutOrderQueryKey,
          'us',
          'en',
          'cart_customer',
        ]),
      ).toBeUndefined()
      expect(
        queryClient.getQueryData([
          ...checkoutOrderSnapshotQueryKey,
          'us',
          'en',
          'cart_customer',
        ]),
      ).toBeUndefined()
    })

    queryClient.setQueryData([...cartQueryKey, 'us', 'en'], cart)
    queryClient.setQueryData(
      [...checkoutOrderQueryKey, 'us', 'en', 'cart_customer'],
      checkout,
    )
    queryClient.setQueryData(
      [...checkoutOrderSnapshotQueryKey, 'us', 'en', 'cart_customer'],
      snapshot,
    )
    logout.mockResolvedValue({ success: true })

    const { result } = renderHook(
      () => useCustomerLogout({ market, onLoggedOut }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.mutateAsync()
    })

    await waitFor(() => expect(onLoggedOut).toHaveBeenCalledOnce())
    expect(logout).toHaveBeenCalledWith({ data: market })
  })

  it('keeps logout successful when the signed-out callback fails', async () => {
    const onLoggedOut = vi
      .fn()
      .mockRejectedValue(new Error('navigation failed'))
    logout.mockResolvedValue({ success: true })
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result } = renderHook(
      () => useCustomerLogout({ market, onLoggedOut }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await expect(result.current.mutateAsync()).resolves.toEqual({
        success: true,
      })
    })

    expect(onLoggedOut).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('ignores a duplicate sign-out while logout and navigation are in flight', async () => {
    let resolveLogout: (value: { success: boolean }) => void = () => undefined
    logout.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveLogout = resolve
      }),
    )
    const onSignedOut = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result } = renderHook(
      () =>
        useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market,
          onSignedOut,
        }),
      { wrapper: createHarness(queryClient) },
    )

    let firstSignOut: Promise<void> | undefined
    act(() => {
      firstSignOut = result.current.signOut()
      void result.current.signOut()
    })

    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    expect(result.current.isSigningOut).toBe(true)

    await act(async () => {
      resolveLogout({ success: true })
      await firstSignOut
    })

    expect(logout).toHaveBeenCalledOnce()
    expect(onSignedOut).toHaveBeenCalledOnce()
    expect(result.current.isSigningOut).toBe(false)
  })

  it('ignores a same-tick sign-out from another observer', async () => {
    let resolveLogout: (value: { success: boolean }) => void = () => undefined
    logout.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveLogout = resolve
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result } = renderHook(
      () => ({
        first: useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market,
        }),
        second: useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market,
        }),
      }),
      { wrapper: createHarness(queryClient) },
    )

    act(() => {
      void result.current.first.signOut()
      void result.current.second.signOut()
    })

    await waitFor(() => expect(logout).toHaveBeenCalledOnce())

    await act(async () => {
      resolveLogout({ success: true })
      await waitFor(() => expect(result.current.first.isSigningOut).toBe(false))
    })

    expect(logout).toHaveBeenCalledOnce()
  })

  it('does not report logout as failed when signed-out navigation fails', async () => {
    logout.mockResolvedValue({ success: true })
    const onSignedOut = vi
      .fn()
      .mockRejectedValue(new Error('navigation failed'))
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result } = renderHook(
      () =>
        useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market,
          onSignedOut,
        }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.signOut()
    })

    expect(logout).toHaveBeenCalledOnce()
    expect(onSignedOut).toHaveBeenCalledOnce()
    expect(result.current.error).toBeNull()
    expect(result.current.isSigningOut).toBe(false)
  })

  it('releases the sign-out guard after a failed logout', async () => {
    logout
      .mockRejectedValueOnce(new Error('logout failed'))
      .mockResolvedValueOnce({ success: true })
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result } = renderHook(
      () =>
        useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market,
        }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.signOut()
    })
    await waitFor(() =>
      expect(result.current.error).toBe('Unable to sign out.'),
    )

    await act(async () => {
      await result.current.signOut()
    })

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(2))
    expect(result.current.error).toBeNull()
  })

  it('uses the current context callback after a market transition', async () => {
    let resolveLogout: (value: { success: boolean }) => void = () => undefined
    logout.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveLogout = resolve
      }),
    )
    const oldOnSignedOut = vi.fn().mockResolvedValue(undefined)
    const currentOnSignedOut = vi.fn().mockResolvedValue(undefined)
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const { result, rerender } = renderHook(
      ({ currentMarket, onSignedOut }) =>
        useCustomerSignOutController({
          errorMessage: 'Unable to sign out.',
          market: currentMarket,
          onSignedOut,
        }),
      {
        initialProps: { currentMarket: market, onSignedOut: oldOnSignedOut },
        wrapper: createHarness(queryClient),
      },
    )

    let signOutPromise: Promise<void> | undefined
    act(() => {
      signOutPromise = result.current.signOut()
    })
    await waitFor(() => expect(logout).toHaveBeenCalledOnce())

    rerender({
      currentMarket: { country: 'de', locale: 'de' },
      onSignedOut: currentOnSignedOut,
    })

    await act(async () => {
      resolveLogout({ success: true })
      await signOutPromise
    })

    expect(oldOnSignedOut).not.toHaveBeenCalled()
    expect(currentOnSignedOut).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.isSigningOut).toBe(false))
  })
})
