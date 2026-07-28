import { describe, expect, it } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import {
  buildConfirmCheckoutPaymentInputData,
  getConfirmPaymentExceptionNavigation,
  getConfirmPaymentResultNavigation,
} from './confirm-payment-return'

const completedOrder: CheckoutOrder = {
  amountDue: {
    amount: 0,
    currencyCode: 'USD',
  },
  appliedDiscounts: [],
  appliedGiftCard: null,
  billingAddress: null,
  completedSteps: ['address', 'delivery', 'payment'],
  currencyCode: 'USD',
  currentStep: 'complete',
  deliveryTotal: {
    amount: 5,
    currencyCode: 'USD',
  },
  discountTotal: {
    amount: 0,
    currencyCode: 'USD',
  },
  email: 'customer@example.com',
  id: 'R123456789',
  itemCount: 1,
  itemTotal: {
    amount: 49.99,
    currencyCode: 'USD',
  },
  items: [
    {
      id: 'line-item-1',
      imageUrl: null,
      name: 'Personal Blender 600ml',
      optionsText: 'White',
      optionValues: [],
      productSlug: 'personal-blender',
      quantity: 1,
      totalPrice: {
        amount: 49.99,
        currencyCode: 'USD',
      },
      unitPrice: {
        amount: 49.99,
        currencyCode: 'USD',
      },
      variantId: 'variant-1',
    },
  ],
  paymentMethods: [],
  requirements: [],
  shippingAddress: null,
  shippingMatchesBillingAddress: true,
  shippingRates: [],
  shippingDiscountTotal: {
    amount: 0,
    currencyCode: 'USD',
  },
  taxTotal: {
    amount: 0,
    currencyCode: 'USD',
  },
  total: {
    amount: 54.99,
    currencyCode: 'USD',
  },
}

describe('confirm payment return helpers', () => {
  it('maps Stripe-style return params to the confirm payment input', () => {
    expect(
      buildConfirmCheckoutPaymentInputData({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        session: 'ps_123',
        sessionResult: 'approved_payload',
      }),
    ).toEqual({
      adyenSessionId: undefined,
      cartId: 'cart_123',
      market: {
        country: 'us',
        locale: 'en',
      },
      redirectResult: undefined,
      sessionId: 'ps_123',
      sessionResult: 'approved_payload',
    })
  })

  it('maps Adyen redirect params to the confirm payment input', () => {
    expect(
      buildConfirmCheckoutPaymentInputData({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        redirectResult: 'adyen_redirect_payload',
        sessionId: 'adyen_session_123',
      }),
    ).toMatchObject({
      adyenSessionId: 'adyen_session_123',
      redirectResult: 'adyen_redirect_payload',
      sessionId: undefined,
    })
  })

  it('routes successful confirmations to the completed order', () => {
    expect(
      getConfirmPaymentResultNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        result: {
          order: completedOrder,
          success: true,
        },
      }),
    ).toEqual({
      kind: 'order_placed',
      params: {
        country: 'us',
        id: 'R123456789',
        locale: 'en',
      },
      to: '/$country/$locale/order-placed/$id',
    })
  })

  it('falls back to the cart id when a successful confirmation has no mapped order', () => {
    expect(
      getConfirmPaymentResultNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        result: {
          order: null,
          success: true,
        },
      }),
    ).toMatchObject({
      kind: 'order_placed',
      params: {
        id: 'cart_123',
      },
    })
  })

  it('routes failed confirmations back to checkout with a stable error code', () => {
    expect(
      getConfirmPaymentResultNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        result: {
          error: 'Payment session is not available.',
          errorCode: 'payment_session_not_ready',
          success: false,
        },
      }),
    ).toEqual({
      error: 'Payment session is not available.',
      errorCode: 'payment_session_not_ready',
      kind: 'checkout',
      params: {
        country: 'us',
        id: 'cart_123',
        locale: 'en',
      },
      search: {
        payment_error: undefined,
        payment_error_code: 'payment_session_not_ready',
      },
      to: '/$country/$locale/checkout/$id',
    })
  })

  it('defaults failed confirmations without a code to payment_failed', () => {
    expect(
      getConfirmPaymentResultNavigation({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        result: {
          error: 'Gateway unavailable',
          success: false,
        },
      }),
    ).toMatchObject({
      error: 'Gateway unavailable',
      errorCode: 'payment_failed',
      kind: 'checkout',
      search: {
        payment_error: undefined,
        payment_error_code: 'payment_failed',
      },
    })
  })

  it('routes thrown confirmation errors back to checkout as payment_failed', () => {
    expect(
      getConfirmPaymentExceptionNavigation({
        cartId: 'cart_123',
        country: 'us',
        error: new Error('Gateway timed out'),
        locale: 'en',
      }),
    ).toMatchObject({
      error: 'Gateway timed out',
      errorCode: 'payment_failed',
      kind: 'checkout',
      params: {
        id: 'cart_123',
      },
      search: {
        payment_error: undefined,
        payment_error_code: 'payment_failed',
      },
    })
  })
})
