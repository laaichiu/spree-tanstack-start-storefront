import type { Order } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import {
  mapSpreeOrderToDetail,
  mapSpreeOrdersToSummaries,
} from '@/lib/account/mappers/order.mapper'

function buildOrder(overrides: Partial<Order> = {}): Order {
  const order: Order = {
    adjustment_total: '0.0',
    additional_tax_total: '0.0',
    amount_due: '0.0',
    billing_address: null,
    completed_at: '2026-06-01T10:00:00Z',
    covered_by_store_credit: false,
    currency: 'USD',
    customer_note: null,
    delivery_total: '0.0',
    discount_total: '0.0',
    discounts: [],
    display_additional_tax_total: '$0.00',
    display_adjustment_total: '$0.00',
    display_amount_due: '$0.00',
    display_delivery_total: '$0.00',
    display_discount_total: '$0.00',
    display_gift_card_total: '$0.00',
    display_included_tax_total: '$0.00',
    display_item_total: '$120.00',
    display_store_credit_total: '$0.00',
    display_tax_total: '$0.00',
    display_total: '$120.00',
    email: 'customer@example.com',
    fulfillment_status: 'shipped',
    fulfillments: [],
    gift_card: null,
    gift_card_total: '0.0',
    id: 'R123456789',
    included_tax_total: '0.0',
    item_total: '120.0',
    items: [],
    locale: 'en',
    market: null,
    market_id: null,
    number: 'R123456789',
    payments: [],
    payment_status: 'paid',
    shipping_address: null,
    store_credit_total: '0.0',
    tax_total: '0.0',
    total: '120.0',
    total_quantity: 2,
  }

  return Object.assign(order, overrides)
}

describe('mapSpreeOrdersToSummaries', () => {
  it('maps completed Spree orders to frontend order summaries', () => {
    expect(mapSpreeOrdersToSummaries([buildOrder()])).toEqual([
      {
        completedAt: '2026-06-01T10:00:00Z',
        displayTotal: '$120.00',
        fulfillmentStatus: 'shipped',
        id: 'R123456789',
        number: 'R123456789',
        paymentStatus: 'paid',
        totalQuantity: 2,
      },
    ])
  })

  it('filters incomplete orders out of account order history', () => {
    expect(
      mapSpreeOrdersToSummaries([
        buildOrder(),
        buildOrder({ completed_at: null, id: 'CART-1', number: 'CART-1' }),
      ]),
    ).toHaveLength(1)
  })

  it('maps order detail fields without leaking the SDK order shape', () => {
    const detail = mapSpreeOrderToDetail(
      buildOrder({
        billing_address: {
          address1: '100 Market St',
          address2: null,
          city: 'San Francisco',
          company: null,
          country_iso: 'US',
          country_name: 'United States',
          first_name: 'Theresa',
          full_name: 'Theresa Chavez',
          id: 'addr_1',
          is_default_billing: true,
          is_default_shipping: false,
          last_name: 'Chavez',
          phone: '555-1000',
          postal_code: '94105',
          quick_checkout: false,
          state_abbr: 'CA',
          state_name: null,
          state_text: 'CA',
        },
        items: [
          {
            additional_tax_total: '0.0',
            adjustment_total: '0.0',
            compare_at_amount: null,
            currency: 'USD',
            digital_links: [],
            discount_total: '0.0',
            discounted_amount: '0.0',
            display_additional_tax_total: '$0.00',
            display_adjustment_total: '$0.00',
            display_compare_at_amount: null,
            display_discounted_amount: '$0.00',
            display_discount_total: '$0.00',
            display_included_tax_total: '$0.00',
            display_pre_tax_amount: '$120.00',
            display_price: '$60.00',
            display_total: '$120.00',
            id: 'li_1',
            included_tax_total: '0.0',
            name: 'Automatic Espresso Machine',
            option_values: [],
            options_text: 'Color: Matte Black',
            pre_tax_amount: '120.0',
            price: '60.0',
            quantity: 2,
            slug: 'automatic-espresso-machine',
            thumbnail_url: '/espresso.png',
            total: '120.0',
            variant_id: 'var_1',
          },
        ],
      }),
    )

    expect(detail.items).toEqual([
      {
        displayPrice: '$60.00',
        displayTotal: '$120.00',
        id: 'li_1',
        imageUrl: '/espresso.png',
        name: 'Automatic Espresso Machine',
        optionsText: 'Color: Matte Black',
        quantity: 2,
        slug: 'automatic-espresso-machine',
        variantId: 'var_1',
      },
    ])
    expect(detail.billingAddress?.fullName).toBe('Theresa Chavez')
  })
})
