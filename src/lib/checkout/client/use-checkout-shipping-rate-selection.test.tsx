import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { MutableRefObject, PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { useCheckoutShippingRateSelection } from './use-checkout-shipping-rate-selection'

const server = vi.hoisted(() => ({
  selectShippingRate: vi.fn(),
}))

vi.mock('./use-checkout-address', () => ({
  useSelectCheckoutShippingRate: () => ({
    isPending: false,
    mutateAsync: server.selectShippingRate,
  }),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}
const cart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const nextCart = {
  ...cart,
  id: 'cart-2',
}
const shippingRate = cart.shippingRates[0]

function createSelectionOptions({
  cart: selectedCart = cart,
  market: selectedMarket = market,
}: {
  cart?: typeof cart
  market?: typeof market
} = {}) {
  return {
    areShippingRatesStale: false,
    cart: selectedCart,
    clearCheckoutSectionError: vi.fn(),
    isAddressComplete: true,
    isAddressPending: false,
    market: selectedMarket,
    markShippingRatesCurrent: vi.fn(),
    pendingPaymentShippingRateRef: {
      current: null,
    } as MutableRefObject<CartShippingRate | null>,
    setCheckoutError: vi.fn(),
    setPendingPaymentSubmitKey: vi.fn(),
    setSingleCheckoutSectionError: vi.fn(),
    t: (key: string) => key,
  }
}

function createHarness() {
  const queryClient = new QueryClient()

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

describe('checkout shipping-rate selection', () => {
  it('keeps the shipping mutation callback stable across unrelated rerenders', () => {
    const { result, rerender } = renderHook(
      ({ revision }: { revision: number }) => {
        void revision

        return useCheckoutShippingRateSelection(createSelectionOptions())
      },
      { initialProps: { revision: 0 }, wrapper: createHarness() },
    )
    const initialSelectShippingRate = result.current.selectShippingRate

    rerender({ revision: 1 })

    expect(result.current.selectShippingRate).toBe(initialSelectShippingRate)
  })

  it('ignores a duplicate manual shipping selection while the first update is in flight', async () => {
    let resolveSelection: (value: typeof cart) => void = () => undefined
    server.selectShippingRate.mockReturnValueOnce(
      new Promise<typeof cart>((resolve) => {
        resolveSelection = resolve
      }),
    )
    const { result } = renderHook(
      () => useCheckoutShippingRateSelection(createSelectionOptions()),
      { wrapper: createHarness() },
    )

    let firstSelection: Promise<void> | undefined
    act(() => {
      firstSelection = result.current.handleSelectShippingRate(shippingRate)
      void result.current.handleSelectShippingRate(shippingRate)
    })

    await waitFor(() =>
      expect(server.selectShippingRate).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveSelection(cart)
      await firstSelection
    })

    expect(server.selectShippingRate).toHaveBeenCalledOnce()
  })

  it('releases the manual selection guard after a failed update', async () => {
    server.selectShippingRate
      .mockRejectedValueOnce(new Error('selection failed'))
      .mockResolvedValueOnce(cart)
    const options = createSelectionOptions()
    const { result } = renderHook(
      () => useCheckoutShippingRateSelection(options),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await result.current.handleSelectShippingRate(shippingRate)
    })
    await act(async () => {
      await result.current.handleSelectShippingRate(shippingRate)
    })

    expect(server.selectShippingRate).toHaveBeenCalledTimes(2)
  })

  it('ignores an old manual selection after the checkout cart changes', async () => {
    let resolveFirst: (cart: typeof nextCart) => void = () => undefined
    const firstSelection = new Promise<typeof nextCart>((resolve) => {
      resolveFirst = resolve
    })
    server.selectShippingRate
      .mockReturnValueOnce(firstSelection)
      .mockResolvedValueOnce(nextCart)
    const markShippingRatesCurrent = vi.fn()
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()

    const { result, rerender } = renderHook(
      ({ selectedCart }: { selectedCart: typeof cart }) =>
        useCheckoutShippingRateSelection({
          ...createSelectionOptions({ cart: selectedCart }),
          markShippingRatesCurrent,
          setCheckoutError,
          setSingleCheckoutSectionError,
        }),
      { initialProps: { selectedCart: cart }, wrapper: createHarness() },
    )

    let firstRequest: Promise<void> | undefined
    act(() => {
      firstRequest = result.current.handleSelectShippingRate(shippingRate)
    })
    await waitFor(() =>
      expect(server.selectShippingRate).toHaveBeenCalledOnce(),
    )

    rerender({ selectedCart: nextCart })

    await act(async () => {
      await result.current.handleSelectShippingRate(shippingRate)
    })

    expect(server.selectShippingRate).toHaveBeenCalledTimes(2)
    expect(markShippingRatesCurrent).toHaveBeenCalledOnce()

    await act(async () => {
      resolveFirst(nextCart)
      await firstRequest
    })

    expect(markShippingRatesCurrent).toHaveBeenCalledOnce()
    expect(setCheckoutError).toHaveBeenCalledTimes(2)
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('ignores a manual selection response after unmount', async () => {
    let resolveSelection: (value: typeof cart) => void = () => undefined
    const selectionRequest = new Promise<typeof cart>((resolve) => {
      resolveSelection = resolve
    })
    server.selectShippingRate.mockReturnValueOnce(selectionRequest)
    const markShippingRatesCurrent = vi.fn()
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { result, unmount } = renderHook(
      () =>
        useCheckoutShippingRateSelection({
          ...createSelectionOptions(),
          markShippingRatesCurrent,
          setCheckoutError,
          setSingleCheckoutSectionError,
        }),
      { wrapper: createHarness() },
    )

    let request: Promise<void> | undefined
    act(() => {
      request = result.current.handleSelectShippingRate(shippingRate)
    })
    await waitFor(() =>
      expect(server.selectShippingRate).toHaveBeenCalledOnce(),
    )

    setCheckoutError.mockClear()
    setSingleCheckoutSectionError.mockClear()
    unmount()

    await act(async () => {
      resolveSelection(cart)
      await request
    })

    expect(markShippingRatesCurrent).not.toHaveBeenCalled()
    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('aborts an old shipping-rate ensure after the checkout cart changes', async () => {
    let resolveEnsure: (cart: typeof nextCart) => void = () => undefined
    const ensureResult = new Promise<typeof nextCart>((resolve) => {
      resolveEnsure = resolve
    })
    server.selectShippingRate.mockReturnValueOnce(ensureResult)

    const { result, rerender } = renderHook(
      ({ selectedCart }: { selectedCart: typeof cart }) =>
        useCheckoutShippingRateSelection(
          createSelectionOptions({ cart: selectedCart }),
        ),
      { initialProps: { selectedCart: cart }, wrapper: createHarness() },
    )

    let ensureRequest: Promise<typeof nextCart | null> | undefined
    act(() => {
      ensureRequest = result.current.ensureSelectedCheckoutShippingRate(
        cart,
        shippingRate,
      )
    })
    await waitFor(() =>
      expect(server.selectShippingRate).toHaveBeenCalledOnce(),
    )

    rerender({ selectedCart: nextCart })

    await act(async () => {
      resolveEnsure(nextCart)
      await ensureRequest
    })

    expect(await ensureRequest).toBeNull()
  })

  it('aborts a shipping-rate ensure after unmount', async () => {
    let resolveEnsure: (value: typeof cart) => void = () => undefined
    const ensureResult = new Promise<typeof cart>((resolve) => {
      resolveEnsure = resolve
    })
    server.selectShippingRate.mockReturnValueOnce(ensureResult)

    const { result, unmount } = renderHook(
      () => useCheckoutShippingRateSelection(createSelectionOptions()),
      { wrapper: createHarness() },
    )

    let ensureRequest: Promise<typeof cart | null> | undefined
    act(() => {
      ensureRequest = result.current.ensureSelectedCheckoutShippingRate(
        cart,
        shippingRate,
      )
    })
    await waitFor(() =>
      expect(server.selectShippingRate).toHaveBeenCalledOnce(),
    )

    unmount()

    await act(async () => {
      resolveEnsure(cart)
      await ensureRequest
    })

    expect(await ensureRequest).toBeNull()
  })
})
