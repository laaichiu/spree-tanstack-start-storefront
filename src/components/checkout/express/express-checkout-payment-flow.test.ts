import type {
  Stripe,
  StripeElements,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { runExpressCheckoutPayment } from './express-checkout-payment-flow'
import type { useExpressCheckoutActions } from './use-express-checkout'

type ExpressCheckoutActions = ReturnType<typeof useExpressCheckoutActions>

const preparePaymentMock = vi.fn()
const createPaymentSessionMock = vi.fn()
const completePaymentSessionMock = vi.fn()
const completeOrderMock = vi.fn()
const elementsSubmitMock = vi.fn()
const createPaymentMethodMock = vi.fn()
const confirmPaymentMock = vi.fn()

afterEach(() => {
  preparePaymentMock.mockReset()
  createPaymentSessionMock.mockReset()
  completePaymentSessionMock.mockReset()
  completeOrderMock.mockReset()
  elementsSubmitMock.mockReset()
  createPaymentMethodMock.mockReset()
  confirmPaymentMock.mockReset()
})

const stripeMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const address = {
  city: 'San Diego',
  country: 'US',
  line1: '3909 Hood Avenue',
  line2: '',
  postal_code: '92121',
  state: 'CA',
}

function event(
  overrides: Partial<StripeExpressCheckoutElementConfirmEvent> = {},
) {
  return {
    billingDetails: {
      address,
      email: 'buyer@example.com',
      name: 'Theresa Chavez',
      phone: '18587790443',
    },
    paymentFailed: vi.fn(),
    shippingAddress: {
      address,
      name: 'Theresa Chavez',
    },
    ...overrides,
  } as unknown as StripeExpressCheckoutElementConfirmEvent
}

function actions(): ExpressCheckoutActions {
  return {
    completeOrder: completeOrderMock,
    completePaymentSession: completePaymentSessionMock,
    createPaymentSession: createPaymentSessionMock,
    preparePayment: preparePaymentMock,
    resolveShipping: vi.fn(),
    selectShippingRates: vi.fn(),
  }
}

function cart(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    id: 'cart_123',
    paymentMethods: [stripeMethod],
    ...overrides,
  } as CheckoutOrder
}

function paymentSession(
  overrides: Partial<CheckoutPaymentSession> = {},
): CheckoutPaymentSession {
  return {
    amount: {
      amount: 42,
      currencyCode: 'USD',
    },
    currencyCode: 'USD',
    customerExternalId: null,
    expiresAt: null,
    externalData: {
      client_secret: 'pi_test_secret',
    },
    externalId: null,
    id: 'ps_123',
    orderId: 'cart_123',
    paymentMethodId: 'pm-stripe',
    status: 'processing',
    ...overrides,
  }
}

function run(
  currentEvent = event(),
  overrides: Partial<Parameters<typeof runExpressCheckoutPayment>[0]> = {},
) {
  const setError = vi.fn()
  const setProcessing = vi.fn()
  const redirectToConfirmation = vi.fn().mockResolvedValue(undefined)
  const redirectToOrderPlaced = vi.fn().mockResolvedValue(undefined)
  const isConfirmingRef = { current: false }
  const stripe = {
    confirmPayment: confirmPaymentMock,
    createPaymentMethod: createPaymentMethodMock,
  } as unknown as Stripe
  const elements = {
    submit: elementsSubmitMock,
  } as unknown as StripeElements

  return {
    isConfirmingRef,
    redirectToConfirmation,
    redirectToOrderPlaced,
    setError,
    setProcessing,
    promise: runExpressCheckoutPayment({
      actions: actions(),
      cartId: 'cart_123',
      elements,
      event: currentEvent,
      isConfirmingRef,
      market: {
        country: getDefaultResolvedMarket().country,
        locale: getDefaultResolvedMarket().locale,
      },
      redirectToConfirmation,
      redirectToOrderPlaced,
      setError,
      setProcessing,
      stripe,
      stripeMethod,
      t: (key) => key,
      ...overrides,
    }),
  }
}

describe('runExpressCheckoutPayment', () => {
  it('fails the wallet event when Stripe is not ready', async () => {
    const currentEvent = event()
    const failedEvent = currentEvent.paymentFailed as ReturnType<typeof vi.fn>

    await runExpressCheckoutPayment({
      actions: actions(),
      cartId: 'cart_123',
      elements: null,
      event: currentEvent,
      isConfirmingRef: { current: false },
      market: { country: 'us', locale: 'en' },
      redirectToConfirmation: vi.fn(),
      redirectToOrderPlaced: vi.fn(),
      setError: vi.fn(),
      setProcessing: vi.fn(),
      stripe: null,
      stripeMethod: null,
      t: (key) => key,
    })

    expect(failedEvent).toHaveBeenCalledWith({ reason: 'fail' })
  })

  it('prepares, confirms, and completes an express checkout payment', async () => {
    const selectedShippingRate = {
      deliveryMethodId: 'delivery-method-1',
      fulfillmentId: 'fulfillment-1',
      id: 'rate-1',
      name: 'Ground',
      displayPrice: { amount: 0, currencyCode: 'USD' },
      price: { amount: 0, currencyCode: 'USD' },
      selected: true,
    }
    const preparedOrder = cart({
      shippingRates: [selectedShippingRate],
    })
    const completedOrder = cart({
      currentStep: 'complete',
    })
    preparePaymentMock.mockResolvedValueOnce({
      order: preparedOrder,
      success: true,
    })
    elementsSubmitMock.mockResolvedValueOnce({})
    createPaymentMethodMock.mockResolvedValueOnce({
      paymentMethod: { id: 'pm_wallet' },
    })
    createPaymentSessionMock.mockResolvedValueOnce(paymentSession())
    confirmPaymentMock.mockResolvedValueOnce({})
    completePaymentSessionMock.mockResolvedValueOnce(
      paymentSession({ status: 'completed' }),
    )
    completeOrderMock.mockResolvedValueOnce({
      order: completedOrder,
      success: true,
    })

    const currentEvent = event()
    const result = run(currentEvent)

    await result.promise

    expect(preparePaymentMock).toHaveBeenCalledOnce()
    expect(elementsSubmitMock).toHaveBeenCalledOnce()
    expect(createPaymentMethodMock).toHaveBeenCalledWith({
      elements: expect.anything(),
    })
    expect(createPaymentSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethodId: 'pm-stripe',
      }),
    )
    expect(confirmPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: 'pi_test_secret',
      }),
    )
    expect(completePaymentSessionMock).toHaveBeenCalledWith({
      selectedShippingRate,
      sessionId: 'ps_123',
    })
    expect(completeOrderMock).toHaveBeenCalledWith({
      selectedShippingRate,
    })
    expect(result.redirectToOrderPlaced).toHaveBeenCalledWith('cart_123')
    expect(result.setProcessing).toHaveBeenNthCalledWith(1, true)
    expect(result.setProcessing).toHaveBeenLastCalledWith(false)
    expect(result.isConfirmingRef.current).toBe(false)
    expect(currentEvent.paymentFailed).not.toHaveBeenCalled()
  })
})
