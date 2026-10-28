import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren, MutableRefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'

import { useCheckoutShippingRateSelection } from './use-checkout-shipping-rate-selection'

const server = vi.hoisted(() => ({
  selectShippingRate: vi.fn(),
}))

vi.mock('../api/address/checkout-address.functions', () => ({
  selectCheckoutShippingRate: server.selectShippingRate,
  updateCheckoutAddress: vi.fn(),
  updateCheckoutBillingAddress: vi.fn(),
}))

vi.mock('../api/checkout-order.functions', () => ({
  getCheckoutCart: vi.fn(),
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
const cart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const shippingRate = cart.shippingRates[0]

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

function createSelectionOptions() {
  return {
    areShippingRatesStale: false,
    cart,
    clearCheckoutSectionError: vi.fn(),
    isAddressComplete: true,
    isAddressPending: false,
    market,
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

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout shipping-rate selection with the real mutation hook', () => {
  it('ignores a same-tick manual selection from another observer', async () => {
    let resolveSelection: (value: typeof cart) => void = () => undefined
    const selectionPromise = new Promise<typeof cart>((resolve) => {
      resolveSelection = resolve
    })
    server.selectShippingRate.mockReturnValueOnce(selectionPromise)

    const { result } = renderHook(
      () => ({
        first: useCheckoutShippingRateSelection(createSelectionOptions()),
        second: useCheckoutShippingRateSelection(createSelectionOptions()),
      }),
      { wrapper: createHarness() },
    )

    let firstSelection: Promise<void> | undefined
    act(() => {
      firstSelection =
        result.current.first.handleSelectShippingRate(shippingRate)
      void result.current.second.handleSelectShippingRate(shippingRate)
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
})
