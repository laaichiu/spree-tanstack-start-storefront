import type { Cart as SpreeCart } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeCartToSummary } from './cart.mapper'

const baseCart = {
  id: 'cart-1',
  market_id: 'market-1',
  number: 'R123',
  token: 'cart-token',
  email: null,
  customer_note: null,
  currency: 'USD',
  locale: 'en',
  total_quantity: 2,
  item_total: '48.00',
  display_item_total: '$48.00',
  adjustment_total: '0.00',
  display_adjustment_total: '$0.00',
  discount_total: '0.00',
  display_discount_total: '$0.00',
  tax_total: '3.20',
  display_tax_total: '$3.20',
  included_tax_total: '0.00',
  display_included_tax_total: '$0.00',
  additional_tax_total: '3.20',
  display_additional_tax_total: '$3.20',
  total: '51.20',
  display_total: '$51.20',
  gift_card_total: '0.00',
  display_gift_card_total: '$0.00',
  amount_due: '51.20',
  display_amount_due: '$51.20',
  delivery_total: '0.00',
  display_delivery_total: '$0.00',
  warnings: [],
  store_credit_total: '0.00',
  display_store_credit_total: '$0.00',
  covered_by_store_credit: false,
  current_step: 'cart',
  completed_steps: [],
  requirements: [],
  shipping_eq_billing_address: false,
  discounts: [],
  fulfillments: [
    {
      id: 'fulfillment-1',
      number: 'H123',
      tracking: null,
      tracking_url: null,
      cost: '5.00',
      display_cost: '$5.00',
      total: '5.00',
      display_total: '$5.00',
      discount_total: '0.00',
      display_discount_total: '$0.00',
      additional_tax_total: '0.00',
      display_additional_tax_total: '$0.00',
      included_tax_total: '0.00',
      display_included_tax_total: '$0.00',
      tax_total: '0.00',
      display_tax_total: '$0.00',
      status: 'pending',
      fulfillment_type: 'shipping',
      fulfilled_at: null,
      items: [],
      delivery_method: {
        id: 'delivery-method-1',
        name: 'Ground',
        code: 'ground',
      },
      stock_location: {
        id: 'stock-location-1',
        state_abbr: 'CA',
        name: 'Main Warehouse',
        address1: '1 Warehouse Way',
        city: 'Los Angeles',
        zipcode: '90001',
        country_iso: 'US',
        country_name: 'United States',
        state_text: 'California',
      },
      delivery_rates: [
        {
          id: 'rate-1',
          delivery_method_id: 'delivery-method-1',
          name: 'Standard Shipping',
          selected: true,
          cost: '5.00',
          total: '5.00',
          additional_tax_total: '0.00',
          included_tax_total: '0.00',
          tax_total: '0.00',
          display_cost: '$5.00',
          display_total: '$5.00',
          display_additional_tax_total: '$0.00',
          display_included_tax_total: '$0.00',
          display_tax_total: '$0.00',
          delivery_method: {
            id: 'delivery-method-1',
            name: 'Ground',
            code: 'ground',
          },
        },
        {
          id: 'rate-2',
          delivery_method_id: 'delivery-method-2',
          name: 'Express Shipping',
          selected: false,
          cost: '15.00',
          total: '15.00',
          additional_tax_total: '0.00',
          included_tax_total: '0.00',
          tax_total: '0.00',
          display_cost: '$15.00',
          display_total: '$15.00',
          display_additional_tax_total: '$0.00',
          display_included_tax_total: '$0.00',
          display_tax_total: '$0.00',
          delivery_method: {
            id: 'delivery-method-2',
            name: 'Express',
            code: 'express',
          },
        },
      ],
    },
  ],
  payments: [],
  billing_address: null,
  shipping_address: null,
  payment_methods: [],
  gift_card: null,
  market: null,
  items: [
    {
      id: 'line-1',
      variant_id: 'variant-1',
      quantity: 2,
      currency: 'USD',
      name: 'Everyday Bowl',
      slug: 'everyday-bowl',
      options_text: 'Color: Stone',
      price: '24.00',
      display_price: '$24.00',
      total: '48.00',
      display_total: '$48.00',
      adjustment_total: '0.00',
      display_adjustment_total: '$0.00',
      additional_tax_total: '3.20',
      display_additional_tax_total: '$3.20',
      included_tax_total: '0.00',
      display_included_tax_total: '$0.00',
      discount_total: '0.00',
      display_discount_total: '$0.00',
      pre_tax_amount: '48.00',
      display_pre_tax_amount: '$48.00',
      discounted_amount: '48.00',
      display_discounted_amount: '$48.00',
      display_compare_at_amount: null,
      compare_at_amount: null,
      thumbnail_url: 'https://example.com/bowl.jpg',
      option_values: [],
      digital_links: [],
    },
  ],
} satisfies SpreeCart

describe('mapSpreeCartToSummary', () => {
  it('maps a Spree cart into the storefront cart summary model', () => {
    expect(mapSpreeCartToSummary(baseCart)).toEqual({
      id: 'cart-1',
      itemCount: 2,
      currencyCode: 'USD',
      currentStep: 'cart',
      completedSteps: [],
      appliedDiscounts: [],
      appliedGiftCard: null,
      itemTotal: {
        amount: 48,
        currencyCode: 'USD',
      },
      discountTotal: {
        amount: 0,
        currencyCode: 'USD',
      },
      deliveryTotal: {
        amount: 0,
        currencyCode: 'USD',
      },
      shippingDiscountTotal: {
        amount: 0,
        currencyCode: 'USD',
      },
      taxTotal: {
        amount: 3.2,
        currencyCode: 'USD',
      },
      total: {
        amount: 51.2,
        currencyCode: 'USD',
      },
      shippingRates: [
        {
          deliveryMethodId: 'delivery-method-1',
          id: 'rate-1',
          fulfillmentId: 'fulfillment-1',
          name: 'Standard Shipping',
          selected: true,
          displayPrice: {
            amount: 5,
            currencyCode: 'USD',
          },
          price: {
            amount: 5,
            currencyCode: 'USD',
          },
        },
        {
          deliveryMethodId: 'delivery-method-2',
          id: 'rate-2',
          fulfillmentId: 'fulfillment-1',
          name: 'Express Shipping',
          selected: false,
          displayPrice: {
            amount: 15,
            currencyCode: 'USD',
          },
          price: {
            amount: 15,
            currencyCode: 'USD',
          },
        },
      ],
      items: [
        {
          id: 'line-1',
          variantId: 'variant-1',
          productSlug: 'everyday-bowl',
          name: 'Everyday Bowl',
          optionsText: 'Color: Stone',
          optionValues: [],
          quantity: 2,
          imageUrl: 'https://example.com/bowl.jpg',
          unitPrice: {
            amount: 24,
            currencyCode: 'USD',
          },
          totalPrice: {
            amount: 48,
            currencyCode: 'USD',
          },
        },
      ],
    })
  })

  it('throws when a cart amount cannot be parsed', () => {
    expect(() =>
      mapSpreeCartToSummary({
        ...baseCart,
        item_total: 'not-a-number',
      }),
    ).toThrow('Spree cart amount is invalid')
  })

  it('maps line item option values for cart option swatches', () => {
    const cart = {
      ...baseCart,
      items: [
        {
          ...baseCart.items[0],
          options_text: 'Color: Matte Black, Size: 39',
          option_values: [
            {
              id: 'option-value-color-black',
              option_type_id: 'option-type-color',
              name: 'matte-black',
              label: 'Matte Black',
              position: 1,
              color_code: '#111111',
              option_type_name: 'color',
              option_type_label: 'Color',
              image_url: null,
            },
            {
              id: 'option-value-size-39',
              option_type_id: 'option-type-size',
              name: '39',
              label: '39',
              position: 2,
              color_code: null,
              option_type_name: 'size',
              option_type_label: 'Shoe size',
              image_url: null,
            },
          ],
        },
      ],
    } satisfies SpreeCart

    expect(mapSpreeCartToSummary(cart).items[0]?.optionValues).toEqual([
      {
        id: 'option-value-color-black',
        label: 'Matte Black',
        name: 'matte-black',
        optionTypeId: 'option-type-color',
        optionTypeLabel: 'Color',
        optionTypeName: 'color',
        position: 1,
        colorCode: '#111111',
      },
      {
        id: 'option-value-size-39',
        label: '39',
        name: '39',
        optionTypeId: 'option-type-size',
        optionTypeLabel: 'Shoe size',
        optionTypeName: 'size',
        position: 2,
        colorCode: null,
      },
    ])
  })

  it('maps applied discounts and gift cards without leaking raw cart fields', () => {
    const cart = {
      ...baseCart,
      amount_due: '41.20',
      display_amount_due: '$41.20',
      discount_total: '-5.00',
      display_discount_total: '-$5.00',
      gift_card_total: '5.00',
      display_gift_card_total: '$5.00',
      total: '46.20',
      display_total: '$46.20',
      discounts: [
        {
          id: 'discount-1',
          promotion_id: 'promotion-1',
          name: 'Ten off',
          description: 'Promotion discount',
          code: '10OFF',
          amount: '-5.00',
          display_amount: '-$5.00',
        },
      ],
      gift_card: {
        id: 'gift-card-1',
        code: 'GC-1234',
        status: 'active',
        currency: 'USD',
        amount: '25.00',
        amount_used: '5.00',
        amount_authorized: '0.00',
        amount_remaining: '20.00',
        display_amount: '$25.00',
        display_amount_used: '$5.00',
        display_amount_remaining: '$20.00',
        expires_at: null,
        redeemed_at: null,
        expired: false,
        active: true,
      },
    } satisfies SpreeCart

    expect(mapSpreeCartToSummary(cart)).toMatchObject({
      appliedDiscounts: [
        {
          id: 'discount-1',
          promotionId: 'promotion-1',
          name: 'Ten off',
          description: 'Promotion discount',
          code: '10OFF',
          amount: {
            amount: -5,
            currencyCode: 'USD',
          },
        },
      ],
      appliedGiftCard: {
        id: 'gift-card-1',
        code: 'GC-1234',
        status: 'active',
        appliedAmount: {
          amount: -5,
          currencyCode: 'USD',
        },
        amountRemaining: {
          amount: 20,
          currencyCode: 'USD',
        },
        expiresAt: null,
        expired: false,
        active: true,
      },
    })
  })

  it('keeps discounted shipping rates separate from their display price', () => {
    const cart = {
      ...baseCart,
      discount_total: '-5.00',
      display_discount_total: '-$5.00',
      fulfillments: [
        {
          ...baseCart.fulfillments[0],
          discount_total: '-5.00',
          display_discount_total: '-$5.00',
          delivery_rates: [
            {
              ...baseCart.fulfillments[0].delivery_rates[0],
              cost: '5.00',
              display_cost: '$5.00',
              total: '0.00',
              display_total: '$0.00',
            },
          ],
        },
      ],
    } satisfies SpreeCart

    expect(mapSpreeCartToSummary(cart)).toMatchObject({
      discountTotal: {
        amount: -5,
        currencyCode: 'USD',
      },
      shippingDiscountTotal: {
        amount: -5,
        currencyCode: 'USD',
      },
      shippingRates: [
        {
          displayPrice: {
            amount: 5,
            currencyCode: 'USD',
          },
          price: {
            amount: 0,
            currencyCode: 'USD',
          },
        },
      ],
    })
  })
})
