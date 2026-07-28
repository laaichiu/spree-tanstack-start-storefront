import { describe, expect, it } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { getCheckoutPaymentStateKey } from '@/lib/checkout/utils/shipping/shipping-rate-selection'

import { getCheckoutPaymentSubmitRefreshAction } from './checkout-payment-submit-refresh'

function shippingRate(
  overrides: Partial<CartShippingRate> = {},
): CartShippingRate {
  return {
    deliveryMethodId: 'dm-ground',
    displayPrice: {
      amount: 5,
      currencyCode: 'USD',
    },
    fulfillmentId: 'fulfillment-1',
    id: 'rate-ground',
    name: 'Ground',
    price: {
      amount: 5,
      currencyCode: 'USD',
    },
    selected: true,
    ...overrides,
  }
}

function checkoutOrder(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: {
      amount: 10,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: ['address', 'delivery'],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: {
      amount: 5,
      currencyCode: 'USD',
    },
    discountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    email: null,
    id: 'cart_123',
    items: [],
    itemCount: 1,
    itemTotal: {
      amount: 10,
      currencyCode: 'USD',
    },
    number: 'R123456789',
    paymentMethods: [],
    requirements: [],
    shippingAddress: null,
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    shippingMatchesBillingAddress: true,
    shippingRates: [shippingRate()],
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 15,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

describe('checkout payment submit refresh action', () => {
  it('navigates when payment readiness produced a replacement checkout cart', () => {
    expect(
      getCheckoutPaymentSubmitRefreshAction({
        currentCartId: 'cart_123',
        fallbackShippingRate: null,
        paymentReadyCart: checkoutOrder({ id: 'cart_456' }),
        previousPaymentStateKey: 'cart_123:previous',
      }),
    ).toEqual({
      cartId: 'cart_456',
      type: 'navigate_checkout',
    })
  })

  it('queues payment submit when checkout totals or selected shipping changed', () => {
    const fallbackRate = shippingRate({
      fulfillmentId: 'fulfillment-fallback',
      id: 'rate-fallback',
    })
    const paymentReadyCart = checkoutOrder({
      shippingRates: [
        shippingRate({
          fulfillmentId: 'fulfillment-new',
          id: 'rate-new',
        }),
      ],
    })

    expect(
      getCheckoutPaymentSubmitRefreshAction({
        currentCartId: 'cart_123',
        fallbackShippingRate: fallbackRate,
        paymentReadyCart,
        previousPaymentStateKey: 'cart_123:previous',
      }),
    ).toEqual({
      paymentStateKey: getCheckoutPaymentStateKey(paymentReadyCart),
      shippingRate: paymentReadyCart.shippingRates[0],
      type: 'queue_payment_submit',
    })
  })

  it('uses the fallback shipping rate when the refreshed cart has no selected rate', () => {
    const fallbackRate = shippingRate({
      fulfillmentId: 'fulfillment-fallback',
      id: 'rate-fallback',
    })
    const paymentReadyCart = checkoutOrder({
      shippingRates: [],
    })

    expect(
      getCheckoutPaymentSubmitRefreshAction({
        currentCartId: 'cart_123',
        fallbackShippingRate: fallbackRate,
        paymentReadyCart,
        previousPaymentStateKey: 'cart_123:previous',
      }),
    ).toMatchObject({
      shippingRate: fallbackRate,
      type: 'queue_payment_submit',
    })
  })

  it('submits payment when the payment state is unchanged', () => {
    const paymentReadyCart = checkoutOrder()

    expect(
      getCheckoutPaymentSubmitRefreshAction({
        currentCartId: 'cart_123',
        fallbackShippingRate: null,
        paymentReadyCart,
        previousPaymentStateKey: getCheckoutPaymentStateKey(paymentReadyCart),
      }),
    ).toEqual({
      type: 'submit_payment',
    })
  })
})
