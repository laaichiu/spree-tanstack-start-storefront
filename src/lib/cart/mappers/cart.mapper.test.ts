// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { Cart as SpreeCart } from '@spree/sdk'

import { baseCart } from './cart.mapper.fixture'
import { mapSpreeCartToSummary } from './cart.mapper'

describe('cart mapping', () => {
  it('normalizes cart totals, line items, and shipping rates', () => {
    expect(mapSpreeCartToSummary(baseCart)).toEqual({
      appliedDiscounts: [],
      appliedGiftCard: null,
      completedSteps: [],
      currencyCode: 'USD',
      currentStep: 'cart',
      deliveryTotal: { amount: 0, currencyCode: 'USD' },
      discountTotal: { amount: 0, currencyCode: 'USD' },
      id: 'cart-1',
      itemCount: 2,
      itemTotal: { amount: 48, currencyCode: 'USD' },
      items: [
        {
          id: 'line-1',
          imageUrl: 'https://example.com/bowl.jpg',
          name: 'Everyday Bowl',
          optionsText: 'Color: Stone',
          optionValues: [],
          productSlug: 'everyday-bowl',
          quantity: 2,
          totalPrice: { amount: 48, currencyCode: 'USD' },
          unitPrice: { amount: 24, currencyCode: 'USD' },
          variantId: 'variant-1',
        },
      ],
      shippingDiscountTotal: { amount: 0, currencyCode: 'USD' },
      shippingRates: [
        {
          deliveryMethodId: 'delivery-method-1',
          displayPrice: { amount: 5, currencyCode: 'USD' },
          fulfillmentId: 'fulfillment-1',
          id: 'rate-1',
          name: 'Standard Shipping',
          price: { amount: 5, currencyCode: 'USD' },
          selected: true,
        },
        {
          deliveryMethodId: 'delivery-method-2',
          displayPrice: { amount: 15, currencyCode: 'USD' },
          fulfillmentId: 'fulfillment-1',
          id: 'rate-2',
          name: 'Express Shipping',
          price: { amount: 15, currencyCode: 'USD' },
          selected: false,
        },
      ],
      taxTotal: { amount: 3.2, currencyCode: 'USD' },
      total: { amount: 51.2, currencyCode: 'USD' },
    })
  })

  it('preserves nullable money instead of treating unavailable totals as zero', () => {
    const cart = {
      ...baseCart,
      delivery_total: null,
      discount_total: null,
      fulfillments: [{ ...baseCart.fulfillments[0], discount_total: null }],
      item_total: null,
      tax_total: null,
      total: null,
    } satisfies SpreeCart

    expect(mapSpreeCartToSummary(cart)).toMatchObject({
      deliveryTotal: null,
      discountTotal: null,
      itemTotal: null,
      shippingDiscountTotal: null,
      taxTotal: null,
      total: null,
    })
  })

  it('maps sale references and structured option values for line items', () => {
    const cart = mapSpreeCartToSummary({
      ...baseCart,
      items: [
        {
          ...baseCart.items[0],
          compare_at_amount: '48.00',
          display_compare_at_amount: '$48.00',
          option_values: [
            {
              color_code: '#111111',
              id: 'option-value-color-black',
              image_url: null,
              label: 'Matte Black',
              name: 'matte-black',
              option_type_id: 'option-type-color',
              option_type_label: 'Color',
              option_type_name: 'color',
              position: 1,
            },
          ],
          options_text: 'Color: Matte Black',
        },
      ],
    })

    expect(cart.items[0]).toMatchObject({
      compareAtTotalPrice: { amount: 48, currencyCode: 'USD' },
      optionValues: [
        {
          colorCode: '#111111',
          id: 'option-value-color-black',
          label: 'Matte Black',
          name: 'matte-black',
          optionTypeId: 'option-type-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
          position: 1,
        },
      ],
    })
  })

  it('normalizes discounts, gift-card usage, and discounted shipping separately', () => {
    const cart = {
      ...baseCart,
      coupon_code: 'generated-10off',
      amount_due: '41.20',
      discount_total: '-10.00',
      discounts: [
        {
          amount: '-5.00',
          code: '10OFF',
          description: 'Promotion discount',
          display_amount: '-$5.00',
          id: 'discount-1',
          name: 'Ten off',
          promotion_id: 'promotion-1',
        },
      ],
      fulfillments: [
        {
          ...baseCart.fulfillments[0],
          delivery_rates: [
            {
              ...baseCart.fulfillments[0].delivery_rates[0],
              cost: '5.00',
              total: '0.00',
            },
          ],
          discount_total: '-5.00',
        },
      ],
      gift_card: {
        active: true,
        amount: '25.00',
        amount_authorized: '0.00',
        amount_remaining: '20.00',
        amount_used: '5.00',
        code: 'GC-1234',
        currency: 'USD',
        display_amount: '$25.00',
        display_amount_remaining: '$20.00',
        display_amount_used: '$5.00',
        expired: false,
        expires_at: null,
        id: 'gift-card-1',
        redeemed_at: null,
        status: 'active',
      },
      gift_card_total: '5.00',
      total: '41.20',
    } satisfies SpreeCart & { coupon_code: string }

    expect(mapSpreeCartToSummary(cart)).toMatchObject({
      couponCode: 'generated-10off',
      appliedDiscounts: [
        {
          amount: { amount: -5, currencyCode: 'USD' },
          code: '10OFF',
          id: 'discount-1',
          promotionId: 'promotion-1',
        },
      ],
      appliedGiftCard: {
        active: true,
        amountRemaining: { amount: 20, currencyCode: 'USD' },
        appliedAmount: { amount: -5, currencyCode: 'USD' },
        code: 'GC-1234',
        expired: false,
        id: 'gift-card-1',
      },
      discountTotal: { amount: -10, currencyCode: 'USD' },
      shippingDiscountTotal: { amount: -5, currencyCode: 'USD' },
      shippingRates: [
        {
          displayPrice: { amount: 5, currencyCode: 'USD' },
          price: { amount: 0, currencyCode: 'USD' },
        },
      ],
    })
  })

  it('fails closed when a required Spree amount is malformed', () => {
    expect(() =>
      mapSpreeCartToSummary({ ...baseCart, item_total: 'not-a-number' }),
    ).toThrow('The cart response is malformed.')
  })

  it.each([
    { ...baseCart, items: null },
    {
      ...baseCart,
      fulfillments: [{ ...baseCart.fulfillments[0], items: null }],
    },
    {
      ...baseCart,
      fulfillments: [{ ...baseCart.fulfillments[0], delivery_rates: null }],
    },
  ])('rejects malformed nested projection arrays: %o', (cart) => {
    expect(() => mapSpreeCartToSummary(cart as never)).toThrow(
      'cart response is malformed',
    )
  })

  it('rejects a fulfillment item that belongs to another cart line item', () => {
    expect(() =>
      mapSpreeCartToSummary({
        ...baseCart,
        fulfillments: [
          {
            ...baseCart.fulfillments[0],
            items: [
              {
                item_id: 'line-other',
                quantity: 1,
                variant_id: 'variant-other',
              },
            ],
          },
        ],
      }),
    ).toThrow('unrelated fulfillment item')
  })

  it.each([
    {
      description: 'cart total quantity',
      cart: { ...baseCart, total_quantity: 1.5 },
    },
    {
      description: 'line item quantity',
      cart: {
        ...baseCart,
        items: [{ ...baseCart.items[0], quantity: 1.5 }],
      },
    },
    {
      description: 'fulfillment item quantity',
      cart: {
        ...baseCart,
        fulfillments: [
          {
            ...baseCart.fulfillments[0],
            items: [
              {
                item_id: 'line-1',
                quantity: 1.5,
                variant_id: 'variant-1',
              },
            ],
          },
        ],
      },
    },
    {
      description: 'option value position',
      cart: {
        ...baseCart,
        items: [
          {
            ...baseCart.items[0],
            option_values: [
              {
                color_code: null,
                id: 'option-value-1',
                image_url: null,
                label: 'Stone',
                name: 'stone',
                option_type_id: 'option-type-color',
                option_type_label: 'Color',
                option_type_name: 'color',
                position: 1.5,
              },
            ],
          },
        ],
      },
    },
  ])('rejects fractional $description before normalization', ({ cart }) => {
    expect(() => mapSpreeCartToSummary(cart as never)).toThrow(
      'cart response is malformed',
    )
  })
})
