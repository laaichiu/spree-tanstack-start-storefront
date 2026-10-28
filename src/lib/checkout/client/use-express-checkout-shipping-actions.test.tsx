import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import type { ExpressCheckoutOrderResult } from '../api/express/checkout-express.types'
import { mapSpreeCheckoutToOrder } from '../mappers/checkout.mapper'
import { useExpressCheckoutPaymentActions } from './use-express-checkout-payment-actions'
import { useExpressCheckoutShippingActions } from './use-express-checkout-shipping-actions'

const server = vi.hoisted(() => ({
  preparePayment: vi.fn(),
  resolveShipping: vi.fn(),
  selectShippingRates: vi.fn(),
}))

vi.mock('../api/express/checkout-express-shipping.functions', () => ({
  resolveExpressCheckoutShipping: server.resolveShipping,
  selectExpressCheckoutShippingRates: server.selectShippingRates,
}))

vi.mock('../api/checkout-order.functions', () => ({
  getCheckoutCart: vi.fn(),
}))

vi.mock('../api/express/checkout-express-payment.functions', () => ({
  prepareExpressCheckoutPayment: server.preparePayment,
}))

vi.mock('../api/payment/checkout-payment.functions', () => ({
  completeCheckoutPaymentSession: vi.fn(),
  createCheckoutPaymentSession: vi.fn(),
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
const successfulResult: ExpressCheckoutOrderResult = {
  order: checkoutOrder,
  success: true,
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

describe('Express Checkout shipping actions', () => {
  it('serializes shipping address and rate writes for the same checkout order', async () => {
    let resolveAddressMutation: (
      result: ExpressCheckoutOrderResult,
    ) => void = () => undefined
    const addressMutation = new Promise<ExpressCheckoutOrderResult>(
      (resolve) => {
        resolveAddressMutation = resolve
      },
    )
    server.resolveShipping.mockReturnValueOnce(addressMutation)
    server.selectShippingRates.mockResolvedValue(successfulResult)

    const { result } = renderHook(
      () =>
        useExpressCheckoutShippingActions({
          cartId: checkoutOrder.id,
          market,
        }),
      { wrapper: createHarness() },
    )

    let addressPromise: Promise<unknown> | undefined
    let ratePromise: Promise<unknown> | undefined
    act(() => {
      addressPromise = result.current.resolveShipping({
        city: 'San Francisco',
        countryIso: 'US',
        postalCode: '94105',
      })
      ratePromise = result.current.selectShippingRates([
        { fulfillmentId: 'fulfillment-1', rateId: 'rate-2' },
      ])
    })

    expect(server.selectShippingRates).not.toHaveBeenCalled()

    await act(async () => {
      resolveAddressMutation(successfulResult)
      await addressPromise
      await ratePromise
    })

    expect(server.selectShippingRates).toHaveBeenCalledWith({
      data: {
        cartId: checkoutOrder.id,
        market: { country: 'us', locale: 'en' },
        selections: [{ fulfillmentId: 'fulfillment-1', rateId: 'rate-2' }],
      },
    })
  })

  it('serializes payment preparation after an active shipping write', async () => {
    let resolveShippingMutation: (
      result: ExpressCheckoutOrderResult,
    ) => void = () => undefined
    const shippingMutation = new Promise<ExpressCheckoutOrderResult>(
      (resolve) => {
        resolveShippingMutation = resolve
      },
    )
    server.resolveShipping.mockReturnValueOnce(shippingMutation)
    server.preparePayment.mockResolvedValue(successfulResult)

    const { result } = renderHook(
      () => ({
        payment: useExpressCheckoutPaymentActions({
          cartId: checkoutOrder.id,
          market,
        }),
        shipping: useExpressCheckoutShippingActions({
          cartId: checkoutOrder.id,
          market,
        }),
      }),
      { wrapper: createHarness() },
    )

    let shippingPromise: Promise<unknown> | undefined
    let paymentPromise: Promise<unknown> | undefined
    act(() => {
      shippingPromise = result.current.shipping.resolveShipping({
        city: 'San Francisco',
        countryIso: 'US',
        postalCode: '94105',
      })
      paymentPromise = result.current.payment.preparePayment({
        billingAddress: {
          address1: '1 Market St',
          city: 'San Francisco',
          country_code: 'US',
          first_name: 'Theresa',
          last_name: 'Chavez',
          postal_code: '94105',
          quick_checkout: true,
        },
        email: 'customer@example.com',
        shippingAddress: {
          address1: '1 Market St',
          city: 'San Francisco',
          country_code: 'US',
          first_name: 'Theresa',
          last_name: 'Chavez',
          postal_code: '94105',
          quick_checkout: true,
        },
      })
    })

    expect(server.preparePayment).not.toHaveBeenCalled()

    await act(async () => {
      resolveShippingMutation(successfulResult)
      await shippingPromise
      await paymentPromise
    })

    expect(server.preparePayment).toHaveBeenCalled()
  })
})
