import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mapSpreePaymentSession } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  completeCheckoutPaymentSessionOnServer,
  createCheckoutPaymentSessionOnServer,
  createDirectCheckoutPaymentOnServer,
} from './checkout-payment.server'
import { ensureCheckoutShippingRateForPayment } from '../checkout-order-state.server'
import {
  getCheckoutCartRequestOptions,
  requireCheckoutCustomerCartAssociation,
} from '../checkout-session.server'

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreePaymentSession: vi.fn((session: { id: string; status: string }) => ({
    id: session.id,
    status: session.status,
  })),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))

vi.mock('../checkout-order-state.server', () => ({
  ensureCheckoutShippingRateForPayment: vi.fn(),
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: vi.fn(() => ({
    spreeToken: 'cart-token',
  })),
  requireCheckoutCustomerCartAssociation: vi.fn(() => ({
    spreeToken: 'cart-token',
    token: 'customer-token',
  })),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_123',
}

const selectedShippingRate = {
  displayPrice: { amount: 5, currencyCode: 'USD' },
  fulfillmentId: 'fulfillment_123',
  id: 'rate_123',
  name: 'Standard shipping',
  price: { amount: 5, currencyCode: 'USD' },
}

function setSpreeClient() {
  const createPaymentSession = vi.fn(async () => ({
    id: 'ps_123',
    status: 'processing',
  }))
  const completePaymentSession = vi.fn(async () => ({
    id: 'ps_123',
    status: 'completed',
  }))
  const getPaymentSession = vi.fn(async () => ({
    id: 'ps_123',
    order_id: 'or_123',
  }))
  const createPayment = vi.fn(async () => ({ id: 'payment_123' }))
  const listCustomerCards = vi.fn(async () => ({
    data: [{ gateway_payment_profile_id: 'pm_saved' }],
  }))

  vi.mocked(getServerSpreeClientForMarket).mockReturnValue({
    carts: {
      paymentSessions: {
        complete: completePaymentSession,
        create: createPaymentSession,
        get: getPaymentSession,
      },
      payments: {
        create: createPayment,
      },
    },
    customer: {
      creditCards: {
        list: listCustomerCards,
      },
    },
  } as never)

  return {
    completePaymentSession,
    createPayment,
    createPaymentSession,
    getPaymentSession,
    listCustomerCards,
  }
}

describe('checkout payment server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureCheckoutShippingRateForPayment).mockResolvedValue({
      paymentMethods: [{ id: 'pm_123' }, { id: 'pm_check' }],
    } as never)
  })

  it('creates a payment session after asserting the selected shipping rate', async () => {
    const { createPaymentSession } = setSpreeClient()
    const externalData = {
      return_url: 'https://store.example/confirm-payment/cart_123',
    } as const

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        externalData,
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate,
      }),
    ).resolves.toEqual({
      id: 'ps_123',
      status: 'processing',
    })

    expect(ensureCheckoutShippingRateForPayment).toHaveBeenCalledWith({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      market,
      selectedShippingRate,
    })
    expect(createPaymentSession).toHaveBeenCalledWith(
      'cart_123',
      {
        external_data: {
          ...externalData,
          return_url: 'http://localhost:3002/us/en/confirm-payment/cart_123',
        },
        payment_method_id: 'pm_123',
      },
      { spreeToken: 'cart-token' },
    )
    expect(mapSpreePaymentSession).toHaveBeenCalled()
  })

  it('associates the customer cart before using a saved Stripe payment method', async () => {
    const { createPaymentSession } = setSpreeClient()
    const externalData = {
      return_url: 'https://store.example/confirm-payment/cart_123',
      stripe_payment_method_id: 'pm_saved',
    } as const

    await createCheckoutPaymentSessionOnServer({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      externalData,
      market,
      paymentMethodId: 'pm_123',
      selectedShippingRate,
    })

    expect(requireCheckoutCustomerCartAssociation).toHaveBeenCalledWith(
      expect.objectContaining({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
      }),
    )
    expect(createPaymentSession).toHaveBeenCalledWith(
      'cart_123',
      {
        external_data: {
          ...externalData,
          return_url: 'http://localhost:3002/us/en/confirm-payment/cart_123',
        },
        payment_method_id: 'pm_123',
      },
      {
        spreeToken: 'cart-token',
        token: 'customer-token',
      },
    )
  })

  it('completes a payment session without comparing cart and order ID namespaces', async () => {
    const { completePaymentSession, getPaymentSession } = setSpreeClient()

    await expect(
      completeCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        externalData: { source: 'stripe' },
        market,
        selectedShippingRate,
        sessionId: 'ps_123',
        sessionResult: 'session-result',
      }),
    ).resolves.toEqual({
      id: 'ps_123',
      status: 'completed',
    })

    expect(completePaymentSession).toHaveBeenCalledWith(
      'cart_123',
      'ps_123',
      {
        external_data: { source: 'stripe' },
        session_result: 'session-result',
      },
      { spreeToken: 'cart-token' },
    )
    expect(getPaymentSession).not.toHaveBeenCalled()
    expect(getCheckoutCartRequestOptions).toHaveBeenCalledWith('cart-token')
  })

  it('creates direct payments through the same shipping-rate boundary', async () => {
    const { createPayment } = setSpreeClient()

    await expect(
      createDirectCheckoutPaymentOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_check',
        selectedShippingRate,
      }),
    ).resolves.toEqual({ success: true })

    expect(createPayment).toHaveBeenCalledWith(
      'cart_123',
      { payment_method_id: 'pm_check' },
      { spreeToken: 'cart-token' },
    )
  })

  it('rejects a payment method that is not available on the latest checkout order', async () => {
    const { createPaymentSession } = setSpreeClient()
    vi.mocked(ensureCheckoutShippingRateForPayment).mockResolvedValueOnce({
      paymentMethods: [{ id: 'pm_current' }],
    } as never)

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_stale',
        selectedShippingRate,
      }),
    ).rejects.toThrow('Selected payment method is no longer available.')
    expect(createPaymentSession).not.toHaveBeenCalled()
  })

  it('rejects a saved Stripe payment method not owned by the customer', async () => {
    const { createPaymentSession, listCustomerCards } = setSpreeClient()
    listCustomerCards.mockResolvedValueOnce({ data: [] })

    await expect(
      createCheckoutPaymentSessionOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        externalData: { stripe_payment_method_id: 'pm_foreign' },
        market,
        paymentMethodId: 'pm_123',
        selectedShippingRate,
      }),
    ).rejects.toThrow('Saved payment method is no longer available.')
    expect(createPaymentSession).not.toHaveBeenCalled()
  })
})
