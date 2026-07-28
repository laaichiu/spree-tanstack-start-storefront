import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { useCheckoutSelectedShippingRate } from './use-checkout-selected-shipping-rate'

afterEach(() => {
  cleanup()
})

function rate(overrides: Partial<CartShippingRate> = {}): CartShippingRate {
  return {
    deliveryMethodId: 'delivery-method-1',
    fulfillmentId: 'fulfillment-1',
    id: 'rate-1',
    name: 'Standard',
    displayPrice: {
      amount: 7.99,
      currencyCode: 'USD',
    },
    price: {
      amount: 7.99,
      currencyCode: 'USD',
    },
    selected: false,
    ...overrides,
  }
}

function checkoutOrder(shippingRates: Array<CartShippingRate>): CheckoutOrder {
  return {
    amountDue: { amount: 107.99, currencyCode: 'USD' },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: { amount: 7.99, currencyCode: 'USD' },
    discountTotal: { amount: 0, currencyCode: 'USD' },
    email: 'theresa@example.com',
    id: 'cart-1',
    itemCount: 1,
    itemTotal: { amount: 100, currencyCode: 'USD' },
    items: [],
    paymentMethods: [],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingRates,
    shippingDiscountTotal: { amount: 0, currencyCode: 'USD' },
    taxTotal: { amount: 0, currencyCode: 'USD' },
    total: { amount: 107.99, currencyCode: 'USD' },
  }
}

describe('useCheckoutSelectedShippingRate', () => {
  it('returns null when no shipping rate is selected', () => {
    const { result } = renderHook(() =>
      useCheckoutSelectedShippingRate(checkoutOrder([rate()])),
    )

    expect(result.current).toBeNull()
  })

  it('keeps an equivalent selected shipping rate stable across order refreshes', () => {
    const { rerender, result } = renderHook(
      ({ order }: { order: CheckoutOrder }) =>
        useCheckoutSelectedShippingRate(order),
      {
        initialProps: {
          order: checkoutOrder([rate({ selected: true })]),
        },
      },
    )
    const firstSelectedRate = result.current

    rerender({
      order: checkoutOrder([rate({ selected: true })]),
    })

    expect(result.current).toBe(firstSelectedRate)
    expect(result.current).toEqual({
      deliveryMethodId: 'delivery-method-1',
      fulfillmentId: 'fulfillment-1',
      id: 'rate-1',
      name: 'Standard',
      displayPrice: {
        amount: 7.99,
        currencyCode: 'USD',
      },
      price: {
        amount: 7.99,
        currencyCode: 'USD',
      },
      selected: true,
    })
  })

  it('updates when the selected shipping rate changes', () => {
    const { rerender, result } = renderHook(
      ({ order }: { order: CheckoutOrder }) =>
        useCheckoutSelectedShippingRate(order),
      {
        initialProps: {
          order: checkoutOrder([rate({ selected: true })]),
        },
      },
    )
    const firstSelectedRate = result.current

    rerender({
      order: checkoutOrder([
        rate({
          id: 'rate-2',
          price: {
            amount: 19.99,
            currencyCode: 'USD',
          },
          selected: true,
        }),
      ]),
    })

    expect(result.current).not.toBe(firstSelectedRate)
    expect(result.current?.id).toBe('rate-2')
    expect(result.current?.price.amount).toBe(19.99)
  })
})
