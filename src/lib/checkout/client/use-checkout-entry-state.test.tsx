import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutEntryStateRuntime } from './use-checkout-entry-state'

const checkoutQuery = vi.hoisted(() => ({
  data: null,
  error: new Error('checkout unavailable'),
  isFetched: true,
  isLoading: false,
  refetch: vi.fn(),
}))
const resetCheckoutSession = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
}))

vi.mock('../../cart/client/use-cart-query', () => ({
  useCart: () => checkoutQuery,
}))

vi.mock('./use-checkout-order', () => ({
  getCheckoutOrderSnapshotQueryKey: vi.fn(),
  useCheckoutOrder: () => checkoutQuery,
}))

vi.mock('./use-checkout-session-reset', () => ({
  useResetCheckoutSession: () => resetCheckoutSession,
}))

function createHarness() {
  const queryClient = new QueryClient()

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { Wrapper }
}

function createOptions(
  market: { country: string; locale: string },
  navigateToCheckout: () => Promise<void>,
) {
  return {
    cartId: 'cart_123',
    cartLoadErrorFallback: 'Unable to load checkout.',
    initialCartLoadError: null,
    market,
    navigateToCheckout,
  }
}

afterEach(() => {
  cleanup()
  checkoutQuery.refetch.mockReset()
  resetCheckoutSession.mutateAsync.mockReset()
})

describe('checkout entry recovery lifecycle', () => {
  it('does not navigate with a reset result after the market changes', async () => {
    let resolveReset: (value: { success: true }) => void = () => undefined
    resetCheckoutSession.mutateAsync.mockReturnValueOnce(
      new Promise<{ success: true }>((resolve) => {
        resolveReset = resolve
      }),
    )
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const { Wrapper } = createHarness()
    const { result, rerender } = renderHook(
      ({ market }: { market: { country: string; locale: string } }) =>
        useCheckoutEntryStateRuntime(createOptions(market, navigateToCheckout)),
      {
        initialProps: { market: { country: 'us', locale: 'en' } },
        wrapper: Wrapper,
      },
    )

    let recovery: Promise<void> | undefined
    act(() => {
      recovery = result.current.recoverCheckoutSession()
    })

    rerender({ market: { country: 'ca', locale: 'en-CA' } })

    await act(async () => {
      resolveReset({ success: true })
      await recovery
    })

    expect(navigateToCheckout).not.toHaveBeenCalled()
  })

  it('navigates after a reset that remains current', async () => {
    resetCheckoutSession.mutateAsync.mockResolvedValue({ success: true })
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () =>
        useCheckoutEntryStateRuntime(
          createOptions({ country: 'us', locale: 'en' }, navigateToCheckout),
        ),
      { wrapper: Wrapper },
    )

    await act(async () => {
      await result.current.recoverCheckoutSession()
    })

    expect(navigateToCheckout).toHaveBeenCalledOnce()
  })

  it('contains a failed reset so the entry error surface remains retryable', async () => {
    resetCheckoutSession.mutateAsync.mockRejectedValue(
      new Error('temporary reset failure'),
    )
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () =>
        useCheckoutEntryStateRuntime(
          createOptions({ country: 'us', locale: 'en' }, navigateToCheckout),
        ),
      { wrapper: Wrapper },
    )

    await expect(
      act(async () => {
        await result.current.recoverCheckoutSession()
      }),
    ).resolves.toBeUndefined()

    expect(navigateToCheckout).not.toHaveBeenCalled()
  })

  it('contains a rejected navigation after a successful reset', async () => {
    resetCheckoutSession.mutateAsync.mockResolvedValue({ success: true })
    const navigateToCheckout = vi
      .fn()
      .mockRejectedValue(new Error('navigation failed'))
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () =>
        useCheckoutEntryStateRuntime(
          createOptions({ country: 'us', locale: 'en' }, navigateToCheckout),
        ),
      { wrapper: Wrapper },
    )

    await expect(
      act(async () => {
        await result.current.recoverCheckoutSession()
      }),
    ).resolves.toBeUndefined()

    expect(navigateToCheckout).toHaveBeenCalledOnce()
  })
})
