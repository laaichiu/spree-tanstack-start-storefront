import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'

import { useCheckoutShippingAddressSave } from './use-checkout-shipping-address-save'

const server = vi.hoisted(() => ({
  updateCheckoutAddress: vi.fn(),
}))

vi.mock('../../api/address/checkout-address.functions', () => ({
  selectCheckoutShippingRate: vi.fn(),
  updateCheckoutAddress: server.updateCheckoutAddress,
  updateCheckoutBillingAddress: vi.fn(),
}))

vi.mock('../../api/checkout-order.functions', () => ({
  getCheckoutCart: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))

const cart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}
const input = { email: 'ada@example.com', shippingAddressId: 'addr_ada' }

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

function createOptions() {
  return {
    cart,
    market,
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    setCheckoutError: vi.fn(),
    t: (key: string) => key,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout shipping-address save with the real mutation hook', () => {
  it('ignores a same-tick save from another observer', async () => {
    let resolveSave: (value: typeof cart) => void = () => undefined
    const savePromise = new Promise<typeof cart>((resolve) => {
      resolveSave = resolve
    })
    server.updateCheckoutAddress.mockReturnValueOnce(savePromise)

    const { result } = renderHook(
      () => ({
        first: useCheckoutShippingAddressSave(createOptions()),
        second: useCheckoutShippingAddressSave(createOptions()),
      }),
      { wrapper: createHarness() },
    )

    let firstRequest: Promise<unknown> | undefined
    act(() => {
      firstRequest = result.current.first.saveShippingAddress(input)
      void result.current.second.saveShippingAddress(input)
    })

    await waitFor(() =>
      expect(server.updateCheckoutAddress).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveSave(cart)
      await firstRequest
    })

    expect(server.updateCheckoutAddress).toHaveBeenCalledOnce()
  })
})
