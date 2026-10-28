import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { getCartQueryKey } from '@/lib/cart/client/cart-query'

import type { CheckoutCompletionResult } from '../utils/completion/checkout-completion-contract'
import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'
import { mapSpreeCheckoutToOrder } from '../mappers/checkout.mapper'
import { useExpressCheckoutCompletionActions } from './use-express-checkout-completion-actions'
import { useExpressCheckoutPaymentActions } from './use-express-checkout-payment-actions'
import {
  useCompleteCheckoutPaymentSession,
  useCompleteCheckoutOrder,
  useCreateCheckoutPaymentSession,
} from './use-checkout-payment'

const server = vi.hoisted(() => ({
  completeOrder: vi.fn(),
  completePaymentSession: vi.fn(),
  createPaymentSession: vi.fn(),
  preparePayment: vi.fn(),
}))

vi.mock('../api/completion/checkout-completion.functions', () => ({
  completeCheckoutOrder: server.completeOrder,
}))

vi.mock('../api/checkout-order.functions', () => ({
  getCheckoutCart: vi.fn(),
}))

vi.mock('../api/express/checkout-express-payment.functions', () => ({
  prepareExpressCheckoutPayment: server.preparePayment,
}))

vi.mock('../api/payment/checkout-payment.functions', () => ({
  completeCheckoutPaymentSession: server.completePaymentSession,
  createCheckoutPaymentSession: server.createPaymentSession,
  createDirectCheckoutPayment: vi.fn(),
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
const paymentSession: CheckoutPaymentSession = {
  id: 'ps_123',
  providerData: { clientSecret: 'secret' },
  status: 'pending',
}
const successfulCompletion: CheckoutCompletionResult = {
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

  return { queryClient, Wrapper }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout payment mutations', () => {
  it('serializes standard and Express payment-session creation for one checkout', async () => {
    let resolveStandardSession: (
      session: CheckoutPaymentSession,
    ) => void = () => undefined
    const standardSessionPromise = new Promise<CheckoutPaymentSession>(
      (resolve) => {
        resolveStandardSession = resolve
      },
    )
    server.createPaymentSession.mockReturnValueOnce(standardSessionPromise)
    server.createPaymentSession.mockResolvedValue(paymentSession)

    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        express: useExpressCheckoutPaymentActions({
          cartId: checkoutOrder.id,
          market,
        }),
        standard: useCreateCheckoutPaymentSession({
          cartId: checkoutOrder.id,
          market,
        }),
      }),
      { wrapper: Wrapper },
    )

    let standardPromise: Promise<unknown> | undefined
    let expressPromise: Promise<unknown> | undefined
    act(() => {
      standardPromise = result.current.standard.mutateAsync({
        paymentMethodId: 'pm_card',
      })
      expressPromise = result.current.express.createPaymentSession({
        paymentMethodId: 'pm_card',
      })
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(server.createPaymentSession).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveStandardSession(paymentSession)
      await standardPromise
      await expressPromise
    })

    expect(server.createPaymentSession).toHaveBeenCalledTimes(2)
  })

  it('serializes payment-session completion before order completion', async () => {
    let resolveSession: (session: CheckoutPaymentSession) => void = () =>
      undefined
    const sessionPromise = new Promise<CheckoutPaymentSession>((resolve) => {
      resolveSession = resolve
    })
    server.completePaymentSession.mockReturnValueOnce(sessionPromise)
    server.completeOrder.mockResolvedValue(successfulCompletion)

    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => ({
        completeOrder: useExpressCheckoutCompletionActions({
          cartId: checkoutOrder.id,
          market,
        }),
        completeSession: useCompleteCheckoutPaymentSession({
          cartId: checkoutOrder.id,
          market,
        }),
      }),
      { wrapper: Wrapper },
    )

    let sessionPromiseResult: Promise<unknown> | undefined
    let orderPromise: Promise<unknown> | undefined
    act(() => {
      sessionPromiseResult = result.current.completeSession.mutateAsync({
        sessionId: paymentSession.id,
      })
      orderPromise = result.current.completeOrder.completeOrder({})
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(server.completeOrder).not.toHaveBeenCalled()

    await act(async () => {
      resolveSession(paymentSession)
      await sessionPromiseResult
      await orderPromise
    })

    expect(server.completeOrder).toHaveBeenCalledOnce()
  })

  it('scopes standard and Express completion invalidation to the active market', async () => {
    server.completeOrder.mockResolvedValue(successfulCompletion)
    const { queryClient, Wrapper } = createHarness()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () => ({
        express: useExpressCheckoutCompletionActions({
          cartId: checkoutOrder.id,
          market,
        }),
        standard: useCompleteCheckoutOrder({
          cartId: checkoutOrder.id,
          market,
        }),
      }),
      { wrapper: Wrapper },
    )

    await act(async () => {
      await result.current.standard.mutateAsync({})
      await result.current.express.completeOrder({})
    })

    const expectedKey = getCartQueryKey({
      country: market.country,
      locale: market.locale,
    })
    expect(invalidateQueries).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: expectedKey,
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: expectedKey,
    })
  })

  it('keeps standard completion successful when background cart refresh fails', async () => {
    server.completeOrder.mockResolvedValue(successfulCompletion)
    const { queryClient, Wrapper } = createHarness()
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(
      new Error('cart refresh failed'),
    )
    const { result } = renderHook(
      () =>
        useCompleteCheckoutOrder({
          cartId: checkoutOrder.id,
          market,
        }),
      { wrapper: Wrapper },
    )

    await act(async () => {
      await expect(result.current.mutateAsync({})).resolves.toEqual(
        successfulCompletion,
      )
    })

    await expect.poll(() => result.current.isSuccess).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('keeps Express completion successful when background cart refresh fails', async () => {
    server.completeOrder.mockResolvedValue(successfulCompletion)
    const { queryClient, Wrapper } = createHarness()
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(
      new Error('cart refresh failed'),
    )
    const { result } = renderHook(
      () =>
        useExpressCheckoutCompletionActions({
          cartId: checkoutOrder.id,
          market,
        }),
      { wrapper: Wrapper },
    )

    await act(async () => {
      await expect(result.current.completeOrder({})).resolves.toEqual(
        successfulCompletion,
      )
    })
  })
})
