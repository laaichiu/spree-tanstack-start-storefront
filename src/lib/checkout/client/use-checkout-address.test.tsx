import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { mapSpreeCheckoutToOrder } from '../mappers/checkout.mapper'
import {
  useSelectCheckoutShippingRate,
  useUpdateCheckoutAddress,
} from './use-checkout-address'
import { useCheckoutOrder } from './use-checkout-order'

const server = vi.hoisted(() => ({
  getCheckoutCart: vi.fn(),
  selectCheckoutShippingRate: vi.fn(),
  updateCheckoutAddress: vi.fn(),
  updateCheckoutBillingAddress: vi.fn(),
}))

vi.mock('../api/address/checkout-address.functions', () => ({
  selectCheckoutShippingRate: server.selectCheckoutShippingRate,
  updateCheckoutAddress: server.updateCheckoutAddress,
  updateCheckoutBillingAddress: server.updateCheckoutBillingAddress,
}))

vi.mock('../api/checkout-order.functions', () => ({
  getCheckoutCart: server.getCheckoutCart,
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
const checkoutOrder = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })

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

describe('checkout address mutations', () => {
  it('does not let an in-flight checkout read overwrite a mutation response', async () => {
    let resolveCheckoutRead: (order: typeof checkoutOrder) => void = () =>
      undefined
    server.getCheckoutCart.mockReturnValue(
      new Promise<typeof checkoutOrder>((resolve) => {
        resolveCheckoutRead = resolve
      }),
    )
    const updatedOrder = { ...checkoutOrder, email: 'updated@example.com' }
    server.updateCheckoutAddress.mockResolvedValue(updatedOrder)
    const { queryClient, Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        address: useUpdateCheckoutAddress({
          cartId: checkoutOrder.id,
          market,
        }),
        order: useCheckoutOrder({
          cartId: checkoutOrder.id,
          initialOrder: checkoutOrder,
          market,
          refetchOnMount: 'always',
        }),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(server.getCheckoutCart).toHaveBeenCalledOnce())

    await act(async () => {
      await result.current.address.mutateAsync({
        shippingAddressId: 'address-1',
      })
    })

    expect(
      queryClient.getQueryData([
        'checkout',
        market.country,
        market.locale,
        checkoutOrder.id,
      ]),
    ).toEqual(updatedOrder)
    await act(async () => {
      resolveCheckoutRead(checkoutOrder)
      await Promise.resolve()
    })

    expect(
      queryClient.getQueryData([
        'checkout',
        market.country,
        market.locale,
        checkoutOrder.id,
      ]),
    ).toEqual(updatedOrder)
  })

  it('serializes address and shipping mutations for the same checkout order', async () => {
    let resolveAddressMutation: (order: typeof checkoutOrder) => void = () =>
      undefined
    const addressMutation = new Promise<typeof checkoutOrder>((resolve) => {
      resolveAddressMutation = resolve
    })
    server.updateCheckoutAddress.mockReturnValueOnce(addressMutation)
    server.selectCheckoutShippingRate.mockResolvedValue(checkoutOrder)

    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        address: useUpdateCheckoutAddress({
          cartId: checkoutOrder.id,
          market,
        }),
        shipping: useSelectCheckoutShippingRate({
          cartId: checkoutOrder.id,
          market,
        }),
      }),
      { wrapper: Wrapper },
    )

    let addressPromise: Promise<unknown> | undefined
    let shippingPromise: Promise<unknown> | undefined
    act(() => {
      addressPromise = result.current.address.mutateAsync({
        shippingAddressId: 'address-1',
      })
      shippingPromise = result.current.shipping.mutateAsync({
        deliveryRateId: 'rate-2',
        fulfillmentId: 'fulfillment-1',
      })
    })

    expect(server.selectCheckoutShippingRate).not.toHaveBeenCalled()

    await act(async () => {
      resolveAddressMutation(checkoutOrder)
      await addressPromise
      await shippingPromise
    })

    expect(server.selectCheckoutShippingRate).toHaveBeenCalledWith({
      data: {
        cartId: checkoutOrder.id,
        deliveryRateId: 'rate-2',
        fulfillmentId: 'fulfillment-1',
        market: { country: 'us', locale: 'en' },
      },
    })
  })
})
