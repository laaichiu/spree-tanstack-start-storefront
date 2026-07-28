import { describe, expect, it } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import {
  findMatchingCheckoutShippingRate,
  getCheckoutPaymentStateKey,
  getSelectedCheckoutShippingRate,
  hasCheckoutSelectedShippingRate,
  shouldRefreshCheckoutOrderWithUpdate,
} from './shipping-rate-selection'

function rate(
  overrides: Partial<CartShippingRate> & Pick<CartShippingRate, 'id'>,
): CartShippingRate {
  return {
    deliveryMethodId: 'delivery-method-1',
    fulfillmentId: 'fulfillment-1',
    name: 'UPS Ground',
    displayPrice: {
      amount: 9.99,
      currencyCode: 'USD',
    },
    price: {
      amount: 9.99,
      currencyCode: 'USD',
    },
    selected: false,
    ...overrides,
  }
}

function checkoutOrder(
  shippingRates: CartShippingRate[],
  overrides: Partial<CheckoutOrder> = {},
): CheckoutOrder {
  return {
    amountDue: { amount: 109.99, currencyCode: 'USD' },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'delivery',
    deliveryTotal: { amount: 9.99, currencyCode: 'USD' },
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
    total: { amount: 109.99, currencyCode: 'USD' },
    ...overrides,
  }
}

describe('checkout shipping rate selection utils', () => {
  it('reads the selected checkout shipping rate', () => {
    const selectedRate = rate({ id: 'rate-1', selected: true })
    const order = checkoutOrder([rate({ id: 'rate-0' }), selectedRate])

    expect(getSelectedCheckoutShippingRate(order)).toBe(selectedRate)
    expect(hasCheckoutSelectedShippingRate(order)).toBe(true)
  })

  it('matches an unchanged shipping rate by id and fulfillment id', () => {
    const preferredRate = rate({ id: 'rate-1' })
    const matchingRate = rate({ id: 'rate-1' })

    expect(
      findMatchingCheckoutShippingRate({
        preferredRate,
        rates: [rate({ id: 'rate-2' }), matchingRate],
      }),
    ).toBe(matchingRate)
  })

  it('matches a regenerated shipping rate by fulfillment, name, and price', () => {
    const preferredRate = rate({ id: 'rate-old' })
    const matchingRate = rate({ id: 'rate-new' })

    expect(
      findMatchingCheckoutShippingRate({
        preferredRate,
        rates: [matchingRate],
      }),
    ).toBe(matchingRate)
  })

  it('matches a regenerated shipping rate by display price when discounts change the final price', () => {
    const preferredRate = rate({
      id: 'rate-old',
      price: { amount: 5, currencyCode: 'USD' },
    })
    const matchingRate = rate({
      id: 'rate-new',
      price: { amount: 0, currencyCode: 'USD' },
    })

    expect(
      findMatchingCheckoutShippingRate({
        preferredRate,
        rates: [matchingRate],
      }),
    ).toBe(matchingRate)
  })

  it('matches a unique regenerated shipping rate by name and price', () => {
    const preferredRate = rate({
      fulfillmentId: 'fulfillment-old',
      id: 'rate-old',
    })
    const matchingRate = rate({
      fulfillmentId: 'fulfillment-new',
      id: 'rate-new',
    })

    expect(
      findMatchingCheckoutShippingRate({
        preferredRate,
        rates: [matchingRate, rate({ id: 'express', name: 'Express' })],
      }),
    ).toBe(matchingRate)
  })

  it('does not guess between ambiguous regenerated rates', () => {
    const preferredRate = rate({ id: 'rate-old' })

    expect(
      findMatchingCheckoutShippingRate({
        preferredRate,
        rates: [
          rate({ fulfillmentId: 'fulfillment-2', id: 'rate-new-1' }),
          rate({ fulfillmentId: 'fulfillment-3', id: 'rate-new-2' }),
        ],
      }),
    ).toBeNull()
  })

  it('includes selected shipping and totals in the payment state key', () => {
    const order = checkoutOrder([rate({ id: 'rate-1', selected: true })])

    expect(getCheckoutPaymentStateKey(order)).toBe(
      'cart-1:USD:fulfillment-1:rate-1:100:9.99:0:109.99:109.99',
    )
  })

  it('refreshes checkout state when rates are missing', () => {
    expect(shouldRefreshCheckoutOrderWithUpdate(checkoutOrder([]))).toBe(true)
  })

  it('refreshes checkout state when selected shipping has not exposed payment methods yet', () => {
    expect(
      shouldRefreshCheckoutOrderWithUpdate(
        checkoutOrder([rate({ id: 'rate-1', selected: true })]),
      ),
    ).toBe(true)
  })

  it('does not refresh checkout state once payment methods are available', () => {
    expect(
      shouldRefreshCheckoutOrderWithUpdate(
        checkoutOrder([rate({ id: 'rate-1', selected: true })], {
          paymentMethods: [
            {
              description: null,
              gatewayId: 'stripe',
              id: 'pm-stripe',
              name: 'Stripe',
              sessionRequired: true,
              type: 'SpreeStripe::Gateway',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('does not refresh free orders just because payment methods are absent', () => {
    expect(
      shouldRefreshCheckoutOrderWithUpdate(
        checkoutOrder([rate({ id: 'rate-1', selected: true })], {
          amountDue: { amount: 0, currencyCode: 'USD' },
          total: { amount: 0, currencyCode: 'USD' },
        }),
      ),
    ).toBe(false)
  })
})
