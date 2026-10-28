import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { mapSpreeCheckoutToOrder } from '../mappers/checkout.mapper'
import type { ExpressCheckoutPaymentActions } from '../utils/express/express-checkout-actions'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { CheckoutPaymentSubmitResult } from '../utils/payment/payment-submit-result'
import { useExpressCheckoutPayment } from '@/components/checkout/express/use-express-checkout-payment'
import { useCheckoutPaymentCompletion } from './use-checkout-payment-completion'
import { useCheckoutPaymentSubmit } from './use-checkout-payment-submit'

const server = vi.hoisted(() => ({
  completeCheckoutOrder: vi.fn(),
  completeCheckoutPaymentSession: vi.fn(),
  createDirectCheckoutPayment: vi.fn(),
  runExpressPayment: vi.fn(),
  submitPayment: vi.fn(),
}))

vi.mock('../api/completion/checkout-completion.functions', () => ({
  completeCheckoutOrder: server.completeCheckoutOrder,
}))

vi.mock('../api/payment/checkout-payment.functions', () => ({
  completeCheckoutPaymentSession: server.completeCheckoutPaymentSession,
  createDirectCheckoutPayment: server.createDirectCheckoutPayment,
}))

vi.mock('../utils/express/express-checkout-payment-flow', () => ({
  runExpressCheckoutPayment: server.runExpressPayment,
}))

vi.mock('../utils/payment/payment-submit', () => ({
  submitCheckoutPayment: server.submitPayment,
}))

vi.mock('@stripe/react-stripe-js', () => ({
  useElements: () => ({}),
  useStripe: () => ({}),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: {
      country: 'us',
      currencyCode: 'USD',
      locale: 'en',
      marketId: 'market-us',
      marketName: 'United States',
    },
    t: () => 'message',
  }),
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
const paymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
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

describe('checkout payment submission', () => {
  it('ignores stale payment error and busy callbacks after the payment context changes', async () => {
    let finishFirstSubmission: () => void = () => undefined
    server.submitPayment.mockImplementationOnce(
      ({
        onPaymentSubmitEnd,
        onPaymentSubmitStart,
        setPaymentError,
      }: {
        onPaymentSubmitEnd: () => void
        onPaymentSubmitStart: () => void
        setPaymentError: (error: string | null) => void
      }) => {
        onPaymentSubmitStart()

        return new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          finishFirstSubmission = () => {
            setPaymentError('stale payment error')
            onPaymentSubmitEnd()
            resolve({ error: 'stale payment error' })
          }
        })
      },
    )
    const setPaymentError = vi.fn()
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof checkoutOrder }) =>
        useCheckoutPaymentSubmit({
          cart,
          clientSecret: 'secret',
          isStripeElementReady: true,
          market,
          paymentSession: {
            id: 'ps_payment',
            providerData: { clientSecret: 'secret' },
            status: 'pending',
          },
          selectedPaymentMethod: paymentMethod,
          selectedSavedPaymentProfileIdForSession: null,
          selectedShippingRate: null,
          setPaymentError,
          shippingReady: true,
          stripePaymentHandleRef: { current: null },
          t: () => 'message',
        }),
      { initialProps: { cart: checkoutOrder }, wrapper: createHarness() },
    )

    let firstSubmission: Promise<unknown> | undefined
    act(() => {
      firstSubmission = result.current.submitPayment()
    })

    await waitFor(() => expect(server.submitPayment).toHaveBeenCalledOnce())
    expect(result.current.isSubmittingPayment).toBe(true)

    rerender({ cart: { ...checkoutOrder, id: 'cart_new' } })

    await act(async () => {
      finishFirstSubmission()
      await firstSubmission
    })

    expect(setPaymentError).not.toHaveBeenCalled()
    expect(result.current.isSubmittingPayment).toBe(false)
  })

  it.each([
    [
      'shipping readiness',
      { shippingReady: false, isStripeElementReady: true },
    ],
    [
      'Stripe Element readiness',
      { shippingReady: true, isStripeElementReady: false },
    ],
  ])(
    'ignores stale callbacks when %s changes without a cart change',
    async (_label, nextReadiness) => {
      let finishSubmission: () => void = () => undefined
      server.submitPayment.mockImplementationOnce(
        ({
          onPaymentSubmitEnd,
          onPaymentSubmitStart,
          setPaymentError,
        }: {
          onPaymentSubmitEnd: () => void
          onPaymentSubmitStart: () => void
          setPaymentError: (error: string) => void
        }) => {
          onPaymentSubmitStart()

          return new Promise<CheckoutPaymentSubmitResult>((resolve) => {
            finishSubmission = () => {
              setPaymentError('stale payment error')
              onPaymentSubmitEnd()
              resolve({ error: 'stale payment error' })
            }
          })
        },
      )
      const setPaymentError = vi.fn()
      const { result, rerender } = renderHook(
        ({ readiness }: { readiness: typeof nextReadiness }) =>
          useCheckoutPaymentSubmit({
            cart: checkoutOrder,
            clientSecret: 'secret',
            isStripeElementReady: readiness.isStripeElementReady,
            market,
            paymentSession: {
              id: 'ps_payment',
              providerData: { clientSecret: 'secret' },
              status: 'pending',
            },
            selectedPaymentMethod: paymentMethod,
            selectedSavedPaymentProfileIdForSession: null,
            selectedShippingRate: null,
            setPaymentError,
            shippingReady: readiness.shippingReady,
            stripePaymentHandleRef: { current: null },
            t: () => 'message',
          }),
        {
          initialProps: {
            readiness: { shippingReady: true, isStripeElementReady: true },
          },
          wrapper: createHarness(),
        },
      )

      let submission: Promise<unknown> | undefined
      act(() => {
        submission = result.current.submitPayment()
      })

      await waitFor(() => expect(server.submitPayment).toHaveBeenCalledOnce())
      rerender({ readiness: nextReadiness })

      await act(async () => {
        finishSubmission()
        await submission
      })

      expect(setPaymentError).not.toHaveBeenCalled()
      await waitFor(() =>
        expect(result.current.isSubmittingPayment).toBe(false),
      )
    },
  )

  it('does not expose an old submission as pending after the payment context changes', async () => {
    let finishSubmission: () => void = () => undefined
    server.submitPayment.mockImplementationOnce(
      () =>
        new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          finishSubmission = () => resolve({ order: null })
        }),
    )
    const { result, rerender } = renderHook(
      ({ shippingReady }: { shippingReady: boolean }) =>
        useCheckoutPaymentSubmit({
          cart: checkoutOrder,
          clientSecret: 'secret',
          isStripeElementReady: true,
          market,
          paymentSession: {
            id: 'ps_payment',
            providerData: { clientSecret: 'secret' },
            status: 'pending',
          },
          selectedPaymentMethod: paymentMethod,
          selectedSavedPaymentProfileIdForSession: null,
          selectedShippingRate: null,
          setPaymentError: vi.fn(),
          shippingReady,
          stripePaymentHandleRef: { current: null },
          t: () => 'message',
        }),
      { initialProps: { shippingReady: true }, wrapper: createHarness() },
    )

    let submission: Promise<unknown> | undefined
    act(() => {
      submission = result.current.submitPayment()
    })

    await waitFor(() => expect(server.submitPayment).toHaveBeenCalledOnce())
    expect(result.current.isSubmittingPayment).toBe(true)

    rerender({ shippingReady: false })

    expect(result.current.isSubmittingPayment).toBe(false)

    await act(async () => {
      finishSubmission()
      await submission
    })

    expect(result.current.isSubmittingPayment).toBe(false)
  })

  it('serializes manual and Express provider confirmation flows for one checkout', async () => {
    let resolveManualSubmission: () => void = () => undefined
    const manualSubmission = new Promise<void>((resolve) => {
      resolveManualSubmission = resolve
    })
    server.submitPayment.mockReturnValueOnce(manualSubmission)
    server.runExpressPayment.mockResolvedValue(undefined)

    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result } = renderHook(
      () => ({
        express: useExpressCheckoutPayment({
          actions: expressActions,
          cart: checkoutOrder,
          setError: vi.fn(),
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
        manual: useCheckoutPaymentSubmit({
          cart: checkoutOrder,
          clientSecret: undefined,
          isStripeElementReady: false,
          market,
          paymentSession: null,
          selectedPaymentMethod: null,
          selectedSavedPaymentProfileIdForSession: null,
          selectedShippingRate: null,
          setPaymentError: vi.fn(),
          shippingReady: false,
          stripePaymentHandleRef: { current: null },
          t: () => 'message',
        }),
      }),
      { wrapper: createHarness() },
    )

    const expressEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    let manualPromise: Promise<unknown> | undefined
    let expressPromise: Promise<unknown> | undefined
    act(() => {
      manualPromise = result.current.manual.submitPayment()
      expressPromise = result.current.express(expressEvent)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(server.submitPayment).toHaveBeenCalledOnce()
    expect(server.runExpressPayment).not.toHaveBeenCalled()

    await act(async () => {
      resolveManualSubmission()
      await manualPromise
      await expressPromise
    })

    expect(server.runExpressPayment).toHaveBeenCalledOnce()
  })

  it('fails a duplicate Express confirmation instead of queueing a second payment', async () => {
    let resolveExpressSubmission: () => void = () => undefined
    server.runExpressPayment.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveExpressSubmission = resolve
      }),
    )
    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result } = renderHook(
      () =>
        useExpressCheckoutPayment({
          actions: expressActions,
          cart: checkoutOrder,
          setError: vi.fn(),
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
      { wrapper: createHarness() },
    )
    const firstEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const secondEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent

    let firstPromise: Promise<unknown> | undefined
    let secondPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current(firstEvent)
      secondPromise = result.current(secondEvent)
    })

    await waitFor(() => expect(server.runExpressPayment).toHaveBeenCalledOnce())
    expect(secondEvent.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' })

    await act(async () => {
      resolveExpressSubmission()
      await firstPromise
      await secondPromise
    })

    expect(server.runExpressPayment).toHaveBeenCalledOnce()
  })

  it('contains an Express payment navigation rejection at the Stripe event boundary', async () => {
    const navigationError = new Error('confirmation navigation failed')
    server.runExpressPayment.mockRejectedValueOnce(navigationError)
    const setError = vi.fn()
    const event = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result } = renderHook(
      () =>
        useExpressCheckoutPayment({
          actions: expressActions,
          cart: checkoutOrder,
          setError,
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(result.current(event)).resolves.toBeUndefined()
    })

    expect(event.paymentFailed).toHaveBeenCalledWith({
      message: 'confirmation navigation failed',
      reason: 'fail',
    })
    expect(setError).toHaveBeenCalledWith('confirmation navigation failed')
  })

  it('does not let an old Express completion release the new cart guard', async () => {
    let resolveFirst: () => void = () => undefined
    let resolveSecond: () => void = () => undefined
    server.runExpressPayment
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSecond = resolve
        }),
      )
    const firstEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const secondEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const thirdEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof checkoutOrder }) =>
        useExpressCheckoutPayment({
          actions: expressActions,
          cart,
          setError: vi.fn(),
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
      {
        initialProps: { cart: checkoutOrder },
        wrapper: createHarness(),
      },
    )

    let firstPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current(firstEvent)
    })

    const nextCart = { ...checkoutOrder, id: 'cart_new' }
    rerender({ cart: nextCart })

    let secondPromise: Promise<unknown> | undefined
    act(() => {
      secondPromise = result.current(secondEvent)
    })

    await waitFor(() =>
      expect(server.runExpressPayment).toHaveBeenCalledTimes(2),
    )

    await act(async () => {
      resolveFirst()
      await firstPromise
    })

    await act(async () => {
      await result.current(thirdEvent)
    })

    expect(thirdEvent.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' })
    expect(server.runExpressPayment).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecond()
      await secondPromise
    })
  })

  it('allows a new Express confirmation after the payment state changes', async () => {
    let resolveFirst: () => void = () => undefined
    server.runExpressPayment
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve
        }),
      )
      .mockResolvedValueOnce(undefined)
    const firstEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const secondEvent = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent
    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof checkoutOrder }) =>
        useExpressCheckoutPayment({
          actions: expressActions,
          cart,
          setError: vi.fn(),
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
      {
        initialProps: { cart: checkoutOrder },
        wrapper: createHarness(),
      },
    )

    let firstPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current(firstEvent)
    })

    const nextCart = {
      ...checkoutOrder,
      amountDue: checkoutOrder.amountDue
        ? {
            ...checkoutOrder.amountDue,
            amount: checkoutOrder.amountDue.amount + 1,
          }
        : null,
    }
    rerender({ cart: nextCart })

    let secondPromise: Promise<unknown> | undefined
    act(() => {
      secondPromise = result.current(secondEvent)
    })

    await waitFor(() => expect(server.runExpressPayment).toHaveBeenCalledOnce())

    await act(async () => {
      resolveFirst()
      await firstPromise
      await secondPromise
    })

    expect(server.runExpressPayment).toHaveBeenCalledTimes(2)
    expect(secondEvent.paymentFailed).not.toHaveBeenCalled()
  })

  it('rejects a stale Express confirmation after the owner returns with the same key', async () => {
    server.runExpressPayment.mockImplementationOnce(
      async ({
        event,
        isCurrent,
      }: {
        event: StripeExpressCheckoutElementConfirmEvent
        isCurrent: () => boolean
      }) => {
        if (!isCurrent()) {
          event.paymentFailed({ reason: 'fail' })
        }
      },
    )
    const expressActions = {} as ExpressCheckoutPaymentActions
    const { result, rerender } = renderHook(
      ({ cart }: { cart: typeof checkoutOrder }) =>
        useExpressCheckoutPayment({
          actions: expressActions,
          cart,
          setError: vi.fn(),
          setProcessing: vi.fn(),
          stripeMethod: null,
        }),
      {
        initialProps: { cart: checkoutOrder },
        wrapper: createHarness(),
      },
    )
    const staleConfirmHandler = result.current

    rerender({ cart: { ...checkoutOrder, id: 'cart_new' } })
    rerender({ cart: checkoutOrder })

    const event = {
      paymentFailed: vi.fn(),
    } as unknown as StripeExpressCheckoutElementConfirmEvent

    await act(async () => {
      await staleConfirmHandler(event)
    })

    expect(event.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' })
  })

  it('ignores a duplicate rendered payment completion while the first is in flight', async () => {
    let resolvePayment: (result: CheckoutPaymentSubmitResult) => void = () =>
      undefined
    const paymentSubmit = vi.fn(
      () =>
        new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          resolvePayment = resolve
        }),
    )
    const navigateToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const paymentSectionRef = {
      current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
    }
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced,
        paymentSectionRef,
        setCheckoutError: vi.fn(),
        setSingleCheckoutSectionError: vi.fn(),
        t: () => 'message',
      }),
    )

    let firstCompletion: Promise<void> | undefined
    let duplicateCompletion: Promise<void> | undefined
    act(() => {
      firstCompletion = result.current()
      duplicateCompletion = result.current()
    })

    expect(paymentSubmit).toHaveBeenCalledOnce()
    expect(navigateToOrderPlaced).not.toHaveBeenCalled()

    await act(async () => {
      resolvePayment({ order: checkoutOrder })
      await firstCompletion
      await duplicateCompletion
    })

    expect(paymentSubmit).toHaveBeenCalledOnce()
    expect(navigateToOrderPlaced).toHaveBeenCalledOnce()
  })

  it('reports a missing rendered payment section instead of treating it as a duplicate', async () => {
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced: vi.fn().mockResolvedValue(undefined),
        paymentSectionRef: { current: null },
        setCheckoutError,
        setSingleCheckoutSectionError,
        t: () => 'Payment form is not ready.',
      }),
    )

    await act(async () => {
      await result.current()
    })

    expect(setCheckoutError).toHaveBeenCalledOnce()
    expect(setCheckoutError).toHaveBeenCalledWith('Payment form is not ready.')
    expect(setSingleCheckoutSectionError).toHaveBeenCalledOnce()
    expect(setSingleCheckoutSectionError).toHaveBeenCalledWith(
      'payment',
      'Payment form is not ready.',
    )
  })

  it('ignores a rendered payment completion after the payment owner changes', async () => {
    let resolveFirstPayment: (
      result: CheckoutPaymentSubmitResult,
    ) => void = () => undefined
    const firstPaymentSubmit = vi.fn(
      () =>
        new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          resolveFirstPayment = resolve
        }),
    )
    const secondPaymentSubmit = vi
      .fn()
      .mockResolvedValue({ order: checkoutOrder })
    const navigateToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const paymentSectionRef = {
      current: { ownerKey: 'payment-owner-1', submit: firstPaymentSubmit },
    }
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced,
        paymentSectionRef,
        setCheckoutError: vi.fn(),
        setSingleCheckoutSectionError: vi.fn(),
        t: () => 'message',
      }),
    )

    let completion: Promise<void> | undefined
    act(() => {
      completion = result.current()
    })

    paymentSectionRef.current = {
      ownerKey: 'payment-owner-2',
      submit: secondPaymentSubmit,
    }

    await act(async () => {
      await result.current()
    })

    await act(async () => {
      resolveFirstPayment({ order: checkoutOrder })
      await completion
    })

    expect(firstPaymentSubmit).toHaveBeenCalledOnce()
    expect(secondPaymentSubmit).toHaveBeenCalledOnce()
    expect(navigateToOrderPlaced).toHaveBeenCalledOnce()
  })

  it('ignores a stale rendered payment completion after the owner returns with the same key', async () => {
    let resolveFirstPayment: (
      result: CheckoutPaymentSubmitResult,
    ) => void = () => undefined
    const firstPaymentSubmit = vi.fn(
      () =>
        new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          resolveFirstPayment = resolve
        }),
    )
    const paymentSectionRef = {
      current: {
        ownerKey: 'payment-owner-1',
        submit: firstPaymentSubmit,
      },
    }
    const navigateToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced,
        paymentSectionRef,
        setCheckoutError: vi.fn(),
        setSingleCheckoutSectionError: vi.fn(),
        t: () => 'message',
      }),
    )

    let completion: Promise<void> | undefined
    act(() => {
      completion = result.current()
    })

    paymentSectionRef.current = {
      ownerKey: 'payment-owner-2',
      submit: vi.fn().mockResolvedValue({ order: checkoutOrder }),
    }
    paymentSectionRef.current = {
      ownerKey: 'payment-owner-1',
      submit: vi.fn().mockResolvedValue({ order: checkoutOrder }),
    }

    await act(async () => {
      resolveFirstPayment({ order: checkoutOrder })
      await completion
    })

    expect(navigateToOrderPlaced).not.toHaveBeenCalled()
  })

  it('releases the rendered payment completion guard after a failed submit', async () => {
    const failure = new Error('payment submit failed')
    const paymentSubmit = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ order: checkoutOrder })
    const navigateToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced,
        paymentSectionRef: {
          current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
        },
        setCheckoutError: vi.fn(),
        setSingleCheckoutSectionError: vi.fn(),
        t: () => 'message',
      }),
    )

    await expect(result.current()).rejects.toBe(failure)

    await act(async () => {
      await result.current()
    })

    expect(paymentSubmit).toHaveBeenCalledTimes(2)
    expect(navigateToOrderPlaced).toHaveBeenCalledOnce()
  })

  it('ignores a rendered payment completion after the checkout cart changes', async () => {
    let resolvePayment: (result: CheckoutPaymentSubmitResult) => void = () =>
      undefined
    const paymentSubmit = vi.fn(
      () =>
        new Promise<CheckoutPaymentSubmitResult>((resolve) => {
          resolvePayment = resolve
        }),
    )
    const navigateToOrderPlaced = vi.fn().mockResolvedValue(undefined)
    const paymentSectionRef = {
      current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
    }
    const { result, rerender } = renderHook(
      ({ cartId }: { cartId: string }) =>
        useCheckoutPaymentCompletion({
          cartId,
          navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
          navigateToOrderPlaced,
          paymentSectionRef,
          setCheckoutError: vi.fn(),
          setSingleCheckoutSectionError: vi.fn(),
          t: () => 'message',
        }),
      { initialProps: { cartId: checkoutOrder.id } },
    )

    let completion: Promise<void> | undefined
    act(() => {
      completion = result.current()
    })

    rerender({ cartId: 'cart-new' })

    await act(async () => {
      resolvePayment({ order: checkoutOrder })
      await completion
    })

    expect(navigateToOrderPlaced).not.toHaveBeenCalled()
  })

  it('forwards an uncertain payment session to confirm-payment recovery', async () => {
    const paymentSubmit = vi.fn().mockResolvedValue({
      confirmPaymentSessionId: 'ps_123',
    } satisfies CheckoutPaymentSubmitResult)
    const navigateToConfirmPayment = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment,
        navigateToOrderPlaced: vi.fn().mockResolvedValue(undefined),
        paymentSectionRef: {
          current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
        },
        setCheckoutError: vi.fn(),
        setSingleCheckoutSectionError: vi.fn(),
        t: () => 'message',
      }),
    )

    await act(async () => {
      await result.current()
    })

    expect(navigateToConfirmPayment).toHaveBeenCalledWith(
      checkoutOrder.id,
      'ps_123',
    )
  })

  it('does not report confirm-payment navigation failure as payment failure', async () => {
    const paymentSubmit = vi.fn().mockResolvedValue({
      confirmPaymentSessionId: 'ps_123',
    } satisfies CheckoutPaymentSubmitResult)
    const navigateToConfirmPayment = vi
      .fn()
      .mockRejectedValue(new Error('confirm-payment navigation failed'))
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment,
        navigateToOrderPlaced: vi.fn().mockResolvedValue(undefined),
        paymentSectionRef: {
          current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
        },
        setCheckoutError,
        setSingleCheckoutSectionError,
        t: (key) => key,
      }),
    )

    await expect(result.current()).resolves.toBeUndefined()

    expect(setCheckoutError).toHaveBeenCalledWith(
      'checkout.paymentConfirmationFailed',
    )
    expect(setSingleCheckoutSectionError).toHaveBeenCalledWith(
      'payment',
      'checkout.paymentConfirmationFailed',
    )
  })

  it('does not report order-placed navigation failure as payment failure', async () => {
    const paymentSubmit = vi.fn().mockResolvedValue({ order: checkoutOrder })
    const navigateToOrderPlaced = vi
      .fn()
      .mockRejectedValue(new Error('order-placed navigation failed'))
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { result } = renderHook(() =>
      useCheckoutPaymentCompletion({
        cartId: checkoutOrder.id,
        navigateToConfirmPayment: vi.fn().mockResolvedValue(undefined),
        navigateToOrderPlaced,
        paymentSectionRef: {
          current: { ownerKey: 'payment-owner-1', submit: paymentSubmit },
        },
        setCheckoutError,
        setSingleCheckoutSectionError,
        t: (key) => key,
      }),
    )

    await expect(result.current()).resolves.toBeUndefined()

    expect(setCheckoutError).toHaveBeenCalledWith(
      'checkout.orderCompleteFailed',
    )
    expect(setSingleCheckoutSectionError).toHaveBeenCalledWith(
      'payment',
      'checkout.orderCompleteFailed',
    )
  })
})
