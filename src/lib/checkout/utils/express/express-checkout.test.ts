import { describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import {
  buildExpressCheckoutAddressParams,
  buildExpressCheckoutLineItems,
  buildExpressCheckoutShippingRateMap,
  getExpressCheckoutAmount,
  getExpressCheckoutSelectedShippingAmount,
  getLineItemsAmount,
  parseExpressCheckoutName,
  toStripeMinorUnit,
} from './express-checkout'

function money(amount: number, currencyCode = 'USD') {
  return {
    amount,
    currencyCode,
  }
}

function order(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: money(114),
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: money(8),
    discountTotal: money(-4),
    email: 'jane@example.com',
    id: 'cart-1',
    itemCount: 1,
    itemTotal: money(100),
    items: [],
    paymentMethods: [],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingRates: [],
    shippingDiscountTotal: money(0),
    taxTotal: money(10),
    total: money(114),
    ...overrides,
  }
}

function rate(
  overrides: Partial<CartShippingRate> & Pick<CartShippingRate, 'id'>,
): CartShippingRate {
  return {
    deliveryMethodId: 'ground',
    fulfillmentId: 'fulfillment-1',
    name: 'Ground',
    displayPrice: money(5),
    price: money(5),
    selected: false,
    ...overrides,
  }
}

describe('express checkout utils', () => {
  it('converts money into Stripe minor units', () => {
    expect(toStripeMinorUnit(money(12.34))).toBe(1234)
    expect(toStripeMinorUnit(money(1234, 'JPY'))).toBe(1234)
  })

  it('builds Stripe line items from a normalized checkout order', () => {
    expect(
      buildExpressCheckoutLineItems({
        discountLabel: 'Discount',
        order: order(),
        subtotalLabel: 'Subtotal',
        taxLabel: 'Tax',
      }),
    ).toEqual([
      {
        amount: 10000,
        name: 'Subtotal',
      },
      {
        amount: -400,
        name: 'Discount',
      },
      {
        amount: 1000,
        name: 'Tax',
      },
    ])
    expect(getExpressCheckoutAmount(order())).toBe(10600)
  })

  it('includes selected shipping in the current Stripe amount', () => {
    const checkoutOrder = order({
      shippingRates: [
        rate({
          id: 'rate-1',
          price: money(8),
          selected: true,
        }),
      ],
    })

    expect(getExpressCheckoutSelectedShippingAmount(checkoutOrder)).toBe(800)
    expect(getExpressCheckoutAmount(checkoutOrder)).toBe(11400)
    expect(
      buildExpressCheckoutLineItems({
        amountDueShippingAmount: 800,
        discountLabel: 'Discount',
        order: checkoutOrder,
        shippingAmount: 800,
        shippingLabel: 'Shipping',
        subtotalLabel: 'Subtotal',
        taxLabel: 'Tax',
      }),
    ).toEqual([
      {
        amount: 10000,
        name: 'Subtotal',
      },
      {
        amount: -400,
        name: 'Discount',
      },
      {
        amount: 1000,
        name: 'Tax',
      },
      {
        amount: 800,
        name: 'Shipping',
      },
    ])
  })

  it('adds checkout credits when reconciling to the payable amount', () => {
    const checkoutOrder = order({
      amountDue: money(94),
      shippingRates: [
        rate({
          id: 'rate-1',
          price: money(8),
          selected: true,
        }),
      ],
    })

    expect(getExpressCheckoutAmount(checkoutOrder)).toBe(9400)
    expect(
      buildExpressCheckoutLineItems({
        amountDueShippingAmount: 800,
        checkoutCreditLabel: 'Gift card / store credit',
        discountLabel: 'Discount',
        order: checkoutOrder,
        shippingAmount: 800,
        shippingLabel: 'Shipping',
        subtotalLabel: 'Subtotal',
        taxLabel: 'Tax',
      }),
    ).toEqual([
      {
        amount: 10000,
        name: 'Subtotal',
      },
      {
        amount: -400,
        name: 'Discount',
      },
      {
        amount: 1000,
        name: 'Tax',
      },
      {
        amount: 800,
        name: 'Shipping',
      },
      {
        amount: -2000,
        name: 'Gift card / store credit',
      },
    ])
  })

  it('keeps candidate shipping separate from the current payable amount', () => {
    expect(
      getLineItemsAmount(
        buildExpressCheckoutLineItems({
          checkoutCreditLabel: 'Gift card / store credit',
          discountLabel: 'Discount',
          order: order({
            amountDue: money(86),
          }),
          shippingAmount: 800,
          shippingLabel: 'Shipping',
          subtotalLabel: 'Subtotal',
          taxLabel: 'Tax',
        }),
      ),
    ).toBe(9400)
  })

  it('subtracts shipping already reflected in amount due before adding candidate shipping', () => {
    expect(
      getLineItemsAmount(
        buildExpressCheckoutLineItems({
          amountDueShippingAmount: 800,
          checkoutCreditLabel: 'Gift card / store credit',
          discountLabel: 'Discount',
          order: order({
            amountDue: money(94),
            shippingRates: [
              rate({
                id: 'rate-1',
                price: money(8),
                selected: true,
              }),
            ],
          }),
          shippingAmount: 1200,
          shippingLabel: 'Shipping',
          subtotalLabel: 'Subtotal',
          taxLabel: 'Tax',
        }),
      ),
    ).toBe(9800)
  })

  it('groups shipping rates by delivery method for Stripe selection', () => {
    const { selectionMap, shippingRates } = buildExpressCheckoutShippingRateMap(
      {
        isGooglePay: false,
        rates: [
          rate({ id: 'rate-1' }),
          rate({
            fulfillmentId: 'fulfillment-2',
            id: 'rate-2',
            price: money(7),
          }),
          rate({
            deliveryMethodId: 'express',
            id: 'rate-3',
            name: 'Express',
            price: money(20),
          }),
        ],
      },
    )

    expect(shippingRates).toEqual([
      {
        amount: 1200,
        displayName: 'Ground',
        id: 'ground',
      },
      {
        amount: 2000,
        displayName: 'Express',
        id: 'express',
      },
    ])
    expect(selectionMap.get('ground')).toEqual([
      {
        fulfillmentId: 'fulfillment-1',
        rateId: 'rate-1',
      },
      {
        fulfillmentId: 'fulfillment-2',
        rateId: 'rate-2',
      },
    ])
  })

  it('adds a stable-looking suffix for Google Pay shipping rates', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)

    const { selectionMap, shippingRates } = buildExpressCheckoutShippingRateMap(
      {
        isGooglePay: true,
        rates: [rate({ id: 'rate-1' })],
      },
    )

    expect(shippingRates[0]?.id).toBe('ground-4fzy')
    expect(selectionMap.get('ground-4fzy')).toEqual([
      {
        fulfillmentId: 'fulfillment-1',
        rateId: 'rate-1',
      },
    ])

    vi.restoreAllMocks()
  })

  it('maps Stripe names and addresses into Spree address params', () => {
    expect(parseExpressCheckoutName('Jane Maria Doe')).toEqual({
      firstName: 'Jane Maria',
      lastName: 'Doe',
    })
    expect(
      buildExpressCheckoutAddressParams({
        address: {
          city: 'San Diego',
          country: 'us',
          line1: '3909 Hood Avenue',
          line2: null,
          postal_code: '92121',
          state: 'CA',
        },
        name: parseExpressCheckoutName('Jane Doe'),
        phone: '+1 555 000 0000',
      }),
    ).toEqual({
      address1: '3909 Hood Avenue',
      address2: undefined,
      city: 'San Diego',
      country_iso: 'US',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+1 555 000 0000',
      postal_code: '92121',
      quick_checkout: true,
      state_name: 'CA',
    })
  })
})
