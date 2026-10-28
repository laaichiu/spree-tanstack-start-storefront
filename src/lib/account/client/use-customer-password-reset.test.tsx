import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCustomerPasswordReset } from './use-customer-password-reset'

const server = vi.hoisted(() => ({
  requestCustomerPasswordReset: vi.fn(),
}))

vi.mock('../api/account.functions', () => ({
  requestCustomerPasswordReset: server.requestCustomerPasswordReset,
}))

const market = { country: 'us', locale: 'en' }
const input = { email: 'ada@example.com' }

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return function Harness({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('customer password-reset request mutation', () => {
  it('serializes requests for the same market', async () => {
    let resolveFirstRequest: () => void = () => undefined
    server.requestCustomerPasswordReset.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveFirstRequest = resolve
      }),
    )
    server.requestCustomerPasswordReset.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(
      () => ({
        first: useCustomerPasswordReset({ market }),
        second: useCustomerPasswordReset({ market }),
      }),
      { wrapper: createHarness() },
    )

    let firstPromise: Promise<unknown> | undefined
    let secondPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current.first.mutateAsync(input)
      secondPromise = result.current.second.mutateAsync(input)
    })

    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledOnce(),
    )
    expect(server.requestCustomerPasswordReset).toHaveBeenCalledWith({
      data: {
        email: input.email,
        market,
      },
    })

    await act(async () => {
      resolveFirstRequest()
      await firstPromise
      await secondPromise
    })

    expect(server.requestCustomerPasswordReset).toHaveBeenCalledTimes(2)
  })

  it('ignores a duplicate submit while the first request is in flight', async () => {
    let resolveRequest: () => void = () => undefined
    server.requestCustomerPasswordReset.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { result } = renderHook(() => useCustomerPasswordReset({ market }), {
      wrapper: createHarness(),
    })

    act(() => {
      result.current.submit(input)
      result.current.submit(input)
    })

    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledOnce(),
    )
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveRequest()
      await waitFor(() => expect(result.current.isPending).toBe(false))
    })
  })

  it('ignores a same-tick request submit from another observer', async () => {
    let resolveRequest: () => void = () => undefined
    server.requestCustomerPasswordReset.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { result } = renderHook(
      () => ({
        first: useCustomerPasswordReset({ market }),
        second: useCustomerPasswordReset({ market }),
      }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.first.submit(input)
      result.current.second.submit(input)
    })

    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveRequest()
      await waitFor(() => expect(result.current.first.isPending).toBe(false))
    })

    expect(server.requestCustomerPasswordReset).toHaveBeenCalledOnce()
  })

  it('releases the duplicate guard after a failed request', async () => {
    server.requestCustomerPasswordReset
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useCustomerPasswordReset({ market }), {
      wrapper: createHarness(),
    })

    act(() => {
      result.current.submit(input)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.submit(input)
    })
    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledTimes(2),
    )
  })

  it('isolates reset-request results and guards across market transitions', async () => {
    let resolveUsRequest: () => void = () => undefined
    server.requestCustomerPasswordReset
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveUsRequest = resolve
        }),
      )
      .mockResolvedValueOnce({ success: true })

    const deMarket = { country: 'de', locale: 'de' }
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useCustomerPasswordReset({ market: currentMarket }),
      {
        initialProps: { currentMarket: market },
        wrapper: createHarness(),
      },
    )

    act(() => {
      result.current.submit(input)
    })
    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledOnce(),
    )

    rerender({ currentMarket: deMarket })
    act(() => {
      result.current.submit(input)
    })
    await waitFor(() =>
      expect(server.requestCustomerPasswordReset).toHaveBeenCalledTimes(2),
    )

    await act(async () => {
      resolveUsRequest()
      await Promise.resolve()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
