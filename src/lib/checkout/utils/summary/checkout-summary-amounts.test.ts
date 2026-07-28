import { describe, expect, it } from 'vitest'

import type { CheckoutSummaryAmountCart } from './checkout-summary-amounts'
import {
  getCheckoutDiscountBreakdown,
  getAppliedCheckoutCreditAmount,
  getCheckoutAmountDue,
} from './checkout-summary-amounts'

function cart(
  overrides: Partial<CheckoutSummaryAmountCart> = {},
): CheckoutSummaryAmountCart {
  return {
    amountDue: {
      amount: 100,
      currencyCode: 'USD',
    },
    currencyCode: 'USD',
    total: {
      amount: 100,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

describe('checkout summary amount helpers', () => {
  it('returns amount due when it belongs to the cart currency', () => {
    expect(getCheckoutAmountDue(cart())).toEqual({
      amount: 100,
      currencyCode: 'USD',
    })
  })

  it('ignores missing or cross-currency amount due values', () => {
    expect(
      getCheckoutAmountDue(
        cart({
          amountDue: undefined,
        }),
      ),
    ).toBeNull()

    expect(
      getCheckoutAmountDue(
        cart({
          amountDue: {
            amount: 90,
            currencyCode: 'EUR',
          },
        }),
      ),
    ).toBeNull()
  })

  it('does not create a credit line when amount due matches or exceeds total', () => {
    expect(getAppliedCheckoutCreditAmount(cart())).toBeNull()
    expect(
      getAppliedCheckoutCreditAmount(
        cart({
          amountDue: {
            amount: 125,
            currencyCode: 'USD',
          },
        }),
      ),
    ).toBeNull()
  })

  it('returns a negative credit amount when gift cards or store credit reduce amount due', () => {
    expect(
      getAppliedCheckoutCreditAmount(
        cart({
          amountDue: {
            amount: 35,
            currencyCode: 'USD',
          },
        }),
      ),
    ).toEqual({
      amount: -65,
      currencyCode: 'USD',
    })
  })

  it('handles a fully covered checkout as a full negative credit line', () => {
    expect(
      getAppliedCheckoutCreditAmount(
        cart({
          amountDue: {
            amount: 0,
            currencyCode: 'USD',
          },
        }),
      ),
    ).toEqual({
      amount: -100,
      currencyCode: 'USD',
    })
  })

  it('does not create a credit line for cross-currency amount due values', () => {
    expect(
      getAppliedCheckoutCreditAmount(
        cart({
          amountDue: {
            amount: 35,
            currencyCode: 'EUR',
          },
        }),
      ),
    ).toBeNull()
  })

  it('uses applied discounts as the checkout discount breakdown', () => {
    expect(
      getCheckoutDiscountBreakdown(
        {
          appliedDiscounts: [
            {
              amount: { amount: -10, currencyCode: 'USD' },
              code: '10off',
              description: null,
              id: 'discount-1',
              name: 'Ten off',
              promotionId: 'promotion-1',
            },
          ],
          currencyCode: 'USD',
          discountTotal: { amount: -10, currencyCode: 'USD' },
          shippingDiscountTotal: { amount: 0, currencyCode: 'USD' },
        },
        {
          additionalDiscount: 'Additional discount',
          discount: 'Discount',
          freeShipping: 'Free Shipping',
        },
      ),
    ).toEqual([
      {
        amount: { amount: -10, currencyCode: 'USD' },
        id: 'discount-1',
        label: '10off',
        source: 'discount',
      },
    ])
  })

  it('adds a free shipping breakdown item when it is only present on fulfillments', () => {
    expect(
      getCheckoutDiscountBreakdown(
        {
          appliedDiscounts: [
            {
              amount: { amount: -88, currencyCode: 'USD' },
              code: '10off',
              description: null,
              id: 'discount-1',
              name: 'Ten off',
              promotionId: 'promotion-1',
            },
          ],
          currencyCode: 'USD',
          discountTotal: { amount: -93, currencyCode: 'USD' },
          shippingDiscountTotal: { amount: -5, currencyCode: 'USD' },
        },
        {
          additionalDiscount: 'Additional discount',
          discount: 'Discount',
          freeShipping: 'Free Shipping',
        },
      ),
    ).toEqual([
      {
        amount: { amount: -88, currencyCode: 'USD' },
        id: 'discount-1',
        label: '10off',
        source: 'discount',
      },
      {
        amount: { amount: -5, currencyCode: 'USD' },
        id: 'shipping-discount',
        label: 'Free Shipping',
        source: 'shipping',
      },
    ])
  })

  it('adds an additional discount item for non-shipping remainders', () => {
    expect(
      getCheckoutDiscountBreakdown(
        {
          appliedDiscounts: [],
          currencyCode: 'USD',
          discountTotal: { amount: -7.5, currencyCode: 'USD' },
          shippingDiscountTotal: { amount: 0, currencyCode: 'USD' },
        },
        {
          additionalDiscount: 'Additional discount',
          discount: 'Discount',
          freeShipping: 'Free Shipping',
        },
      ),
    ).toEqual([
      {
        amount: { amount: -7.5, currencyCode: 'USD' },
        id: 'additional-discount',
        label: 'Additional discount',
        source: 'other',
      },
    ])
  })
})
