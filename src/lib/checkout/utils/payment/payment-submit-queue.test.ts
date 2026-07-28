import { describe, expect, it } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'

import { getPendingCheckoutPaymentSubmitAction } from './payment-submit-queue'

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
    selected: false,
    ...overrides,
  }
}

const baseOptions = {
  hasSelectedShippingRate: true,
  isCheckoutPending: false,
  isPaymentBusy: false,
  isPaymentReady: true,
  isPaymentSetupPending: false,
  isShippingPending: false,
  paymentStateKey: 'cart_123:USD:fulfillment-1:rate-ground',
  pendingPaymentShippingRate: null,
  pendingPaymentSubmitKey: 'cart_123:USD:fulfillment-1:rate-ground',
  shippingRates: [],
}

describe('pending checkout payment submit action', () => {
  it('stays idle when no payment submit is queued', () => {
    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        pendingPaymentSubmitKey: null,
      }),
    ).toEqual({ type: 'idle' })
  })

  it('waits until a pending shipping rate can be re-selected', () => {
    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        hasSelectedShippingRate: false,
        pendingPaymentShippingRate: null,
        shippingRates: [shippingRate()],
      }),
    ).toEqual({ type: 'wait' })

    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        hasSelectedShippingRate: false,
        isShippingPending: true,
        pendingPaymentShippingRate: shippingRate(),
        shippingRates: [shippingRate()],
      }),
    ).toEqual({ type: 'wait' })
  })

  it('selects a matching shipping rate before submitting payment', () => {
    const pendingRate = shippingRate({
      id: 'rate-old',
    })
    const matchingRate = shippingRate({
      fulfillmentId: pendingRate.fulfillmentId,
      id: 'rate-new',
    })

    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        hasSelectedShippingRate: false,
        pendingPaymentShippingRate: pendingRate,
        shippingRates: [matchingRate],
      }),
    ).toEqual({
      rate: matchingRate,
      type: 'select_shipping_rate',
    })
  })

  it('fails when the queued shipping rate no longer matches any available rate', () => {
    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        hasSelectedShippingRate: false,
        pendingPaymentShippingRate: shippingRate({
          displayPrice: {
            amount: 7,
            currencyCode: 'USD',
          },
          id: 'rate-old',
          name: 'Express',
          price: {
            amount: 7,
            currencyCode: 'USD',
          },
        }),
        shippingRates: [
          shippingRate({
            fulfillmentId: 'fulfillment-2',
            id: 'rate-ground',
          }),
          shippingRate({
            fulfillmentId: 'fulfillment-3',
            id: 'rate-priority',
            name: 'Priority',
          }),
        ],
      }),
    ).toEqual({ type: 'shipping_rate_missing' })
  })

  it('waits while the refreshed payment state is still settling', () => {
    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        paymentStateKey: 'cart_123:changed',
      }),
    ).toEqual({ type: 'wait' })

    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        isPaymentSetupPending: true,
      }),
    ).toEqual({ type: 'wait' })
  })

  it('fails when payment details are no longer ready after refresh', () => {
    expect(
      getPendingCheckoutPaymentSubmitAction({
        ...baseOptions,
        isPaymentReady: false,
      }),
    ).toEqual({ type: 'payment_details_changed' })
  })

  it('submits payment once the queued payment state is ready', () => {
    expect(getPendingCheckoutPaymentSubmitAction(baseOptions)).toEqual({
      type: 'submit_payment',
    })
  })
})
