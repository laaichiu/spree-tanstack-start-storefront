import type { Address, Cart as SpreeCart, PaymentSession } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import {
  mapSpreeCheckoutToOrder,
  mapSpreePaymentSession,
} from './checkout.mapper'

const shippingAddress = {
  address1: '1 Market St',
  address2: 'Suite 200',
  city: 'San Francisco',
  company: 'Spree',
  country_iso: 'US',
  country_name: 'United States',
  first_name: 'Theresa',
  full_name: 'Theresa Chavez',
  id: 'addr-ship',
  is_default_billing: false,
  is_default_shipping: true,
  last_name: 'Chavez',
  phone: '+1 555 0100',
  postal_code: '94105',
  quick_checkout: false,
  state_abbr: 'CA',
  state_name: 'California',
  state_text: 'California',
} satisfies Address

const billingAddress = {
  ...shippingAddress,
  address1: '5 Billing Ave',
  id: 'addr-bill',
  is_default_billing: true,
  is_default_shipping: false,
} satisfies Address

const checkoutCart = {
  additional_tax_total: '0.00',
  adjustment_total: '0.00',
  amount_due: '879.99',
  billing_address: billingAddress,
  channel_id: null,
  completed_steps: ['cart', 'address', 'delivery'],
  covered_by_store_credit: false,
  currency: 'USD',
  current_step: 'payment',
  customer_note: null,
  delivery_total: '0.00',
  discount_total: '0.00',
  discounts: [],
  display_additional_tax_total: '$0.00',
  display_adjustment_total: '$0.00',
  display_amount_due: '$879.99',
  display_delivery_total: '$0.00',
  display_discount_total: '$0.00',
  display_gift_card_total: '$0.00',
  display_included_tax_total: '$0.00',
  display_item_total: '$879.99',
  display_store_credit_total: '$0.00',
  display_tax_total: '$0.00',
  display_total: '$879.99',
  email: 'customer@example.com',
  fulfillments: [],
  gift_card: null,
  gift_card_total: '0.00',
  id: 'cart-1',
  included_tax_total: '0.00',
  item_total: '879.99',
  items: [],
  locale: 'en',
  market: null,
  market_id: 'market-1',
  number: 'R123',
  payment_methods: [
    {
      description: null,
      id: 'pm-1',
      name: 'Stripe',
      source_required: true,
      session_required: true,
      type: 'SpreeStripe::Gateway',
    },
  ],
  payments: [],
  requirements: [
    {
      field: 'shipping_address',
      message: 'Select a shipping method',
      step: 'delivery',
    },
  ],
  shipping_address: shippingAddress,
  shipping_eq_billing_address: false,
  store_credit_total: '0.00',
  tax_total: '0.00',
  token: 'cart-token',
  total: '879.99',
  total_quantity: 1,
  warnings: [],
} satisfies SpreeCart

const stripePaymentSession = {
  amount: '879.99',
  currency: 'USD',
  customer_external_id: null,
  expires_at: '2026-06-15T10:00:00Z',
  external_data: {
    client_secret: 'pi_secret_123',
    nested: {
      enabled: true,
    },
  },
  external_id: 'pi_123',
  id: 'ps-1',
  order_id: 'cart-1',
  payment_method: {
    description: null,
    id: 'pm-1',
    name: 'Stripe',
    source_required: true,
    session_required: true,
    type: 'SpreeStripe::Gateway',
  },
  payment_method_id: 'pm-1',
  status: 'requires_confirmation',
} satisfies PaymentSession

describe('mapSpreeCheckoutToOrder', () => {
  it('maps checkout-only payment methods and requirements', () => {
    expect(mapSpreeCheckoutToOrder(checkoutCart)).toMatchObject({
      amountDue: {
        amount: 879.99,
        currencyCode: 'USD',
      },
      billingAddress: {
        address1: '5 Billing Ave',
        countryIso: 'US',
        fullName: 'Theresa Chavez',
        stateAbbr: 'CA',
      },
      currentStep: 'payment',
      email: 'customer@example.com',
      paymentMethods: [
        {
          gatewayId: 'stripe',
          id: 'pm-1',
          name: 'Stripe',
          sessionRequired: true,
          type: 'SpreeStripe::Gateway',
        },
      ],
      requirements: [
        {
          field: 'shipping_address',
          message: 'Select a shipping method',
          step: 'delivery',
        },
      ],
      shippingAddress: {
        address1: '1 Market St',
        countryIso: 'US',
        fullName: 'Theresa Chavez',
        stateAbbr: 'CA',
      },
      shippingMatchesBillingAddress: false,
    })
  })

  it('maps receipt details for a completed checkout order', () => {
    const completedOrder = {
      ...checkoutCart,
      current_step: 'complete',
      fulfillments: [
        {
          additional_tax_total: '0.00',
          cost: '5.00',
          delivery_method: {
            code: 'ups-ground',
            id: 'dm-1',
            name: 'UPS Ground (USD)',
          },
          delivery_rates: [],
          discount_total: '0.00',
          display_additional_tax_total: '$0.00',
          display_cost: '$5.00',
          display_discount_total: '$0.00',
          display_included_tax_total: '$0.00',
          display_tax_total: '$0.00',
          display_total: '$5.00',
          fulfilled_at: null,
          fulfillment_type: 'shipping',
          id: 'fulfillment-1',
          included_tax_total: '0.00',
          items: [
            {
              item_id: 'line-1',
              quantity: 1,
              variant_id: 'variant-1',
            },
          ],
          number: 'H123',
          status: 'ready',
          stock_location: {
            address1: '1 Warehouse Way',
            city: 'Los Angeles',
            country_iso: 'US',
            country_name: 'United States',
            id: 'stock-location-1',
            name: 'Main Warehouse',
            state_abbr: 'CA',
            state_text: 'California',
            zipcode: '90001',
          },
          tax_total: '0.00',
          total: '5.00',
          tracking: null,
          tracking_url: null,
        },
      ],
      payments: [
        {
          amount: '119.99',
          display_amount: '$119.99',
          id: 'payment-1',
          number: 'P123',
          payment_method: {
            description: null,
            id: 'pm-1',
            name: 'Stripe',
            source_required: true,
            session_required: true,
            type: 'SpreeStripe::Gateway',
          },
          payment_method_id: 'pm-1',
          response_code: 'auth-123',
          source: null,
          source_id: null,
          source_type: null,
          status: 'completed',
        },
        {
          amount: '119.99',
          display_amount: '$119.99',
          id: 'payment-void',
          number: 'P124',
          payment_method: {
            description: null,
            id: 'pm-1',
            name: 'Stripe',
            source_required: true,
            session_required: true,
            type: 'SpreeStripe::Gateway',
          },
          payment_method_id: 'pm-1',
          response_code: null,
          source: null,
          source_id: null,
          source_type: null,
          status: 'void',
        },
      ],
    } satisfies SpreeCart

    expect(mapSpreeCheckoutToOrder(completedOrder)).toMatchObject({
      fulfillmentStatus: 'ready',
      fulfillments: [
        {
          displayCost: '$5.00',
          itemQuantity: 1,
          methodName: 'UPS Ground (USD)',
          number: 'H123',
          status: 'ready',
        },
      ],
      number: 'R123',
      payments: [
        {
          displayAmount: '$119.99',
          methodName: 'Stripe',
          number: 'P123',
          responseCode: 'auth-123',
          status: 'completed',
        },
      ],
      paymentStatus: 'completed',
    })
  })

  it('maps provider payment session data behind a checkout model', () => {
    expect(mapSpreePaymentSession(stripePaymentSession)).toMatchObject({
      amount: {
        amount: 879.99,
        currencyCode: 'USD',
      },
      externalData: {
        client_secret: 'pi_secret_123',
        nested: {
          enabled: true,
        },
      },
      externalId: 'pi_123',
      id: 'ps-1',
      paymentMethodId: 'pm-1',
      status: 'requires_confirmation',
    })
  })
})
