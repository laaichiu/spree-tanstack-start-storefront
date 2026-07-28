import { describe, expect, it } from 'vitest'

import type { CartSummary } from '@/lib/cart/model/cart'

import { getConfirmedCartDeliveryTotal } from './cart-shipping'

function cart({
  deliveryAmount = 0,
  selectedShippingRate = false,
}: {
  deliveryAmount?: number
  selectedShippingRate?: boolean
} = {}): CartSummary {
  const zero = { amount: 0, currencyCode: 'USD' }

  return {
    appliedDiscounts: [],
    appliedGiftCard: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'cart',
    deliveryTotal: { amount: deliveryAmount, currencyCode: 'USD' },
    discountTotal: zero,
    id: 'cart-1',
    itemCount: 0,
    items: [],
    itemTotal: zero,
    shippingDiscountTotal: zero,
    shippingRates: selectedShippingRate
      ? [
          {
            deliveryMethodId: 'delivery-standard',
            displayPrice: zero,
            fulfillmentId: 'fulfillment-1',
            id: 'rate-standard',
            name: 'Standard',
            price: zero,
            selected: true,
          },
        ]
      : [],
    taxTotal: zero,
    total: zero,
  }
}

describe('getConfirmedCartDeliveryTotal', () => {
  it('keeps shipping unconfirmed until Spree returns a delivery amount or selection', () => {
    expect(getConfirmedCartDeliveryTotal(cart())).toBeNull()
  })

  it('returns the delivery total calculated by Spree', () => {
    expect(getConfirmedCartDeliveryTotal(cart({ deliveryAmount: 12 }))).toEqual(
      { amount: 12, currencyCode: 'USD' },
    )
  })

  it('treats a zero total as confirmed only when Spree selected a rate', () => {
    expect(
      getConfirmedCartDeliveryTotal(cart({ selectedShippingRate: true })),
    ).toEqual({ amount: 0, currencyCode: 'USD' })
  })
})
