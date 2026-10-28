// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createClient } from '@spree/sdk'

import type {
  Address,
  Cart as SpreeCart,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
  PaymentSession as SpreePaymentSession,
} from '@spree/sdk'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { assertSpreeCheckoutAddressResponse } from '@/lib/cart/mappers/cart-projection-response'

import {
  mapSpreeCheckoutToOrder,
  mapSpreeOrderGroupToCheckoutOrder,
  mapSpreePaymentSession,
} from './checkout.mapper'

function address(overrides: Partial<Address> = {}): Address {
  const baseAddress: Address = {
    address1: '1 Market St',
    address2: 'Suite 200',
    city: 'San Francisco',
    company: 'Spree',
    country_code: 'US',
    country_iso: 'GB',
    country_name: 'United States',
    first_name: 'Theresa',
    full_name: 'Theresa Chavez',
    id: 'addr-ship',
    label: null,
    owner: null,
    is_default_billing: false,
    is_default_shipping: true,
    last_name: 'Chavez',
    phone: '+1 555 0100',
    postal_code: '94105',
    quick_checkout: false,
    state_abbr: 'OLD',
    state_code: 'CA',
    state_name: 'California',
    state_text: 'California',
  }

  return { ...baseAddress, ...overrides }
}

describe('checkout mapping', () => {
  it('maps canonical SDK responses without display aliases, preserving hidden costs', async () => {
    const cart = {
      ...baseCart,
      fulfillments: baseCart.fulfillments.map((fulfillment) => ({
        ...fulfillment,
        cost: null,
      })),
      payments: [
        {
          amount: '1.234',
          id: 'py_money',
          number: 'P123',
          payment_method_id: 'pm_money',
          response_code: null,
          source_type: 'store_credit',
          source_id: 'credit_money',
          source: {
            id: 'credit_money',
            amount: null,
            amount_remaining: null,
            amount_used: null,
            currency: 'USD',
          },
          status: 'completed',
          payment_method: {
            id: 'pm_money',
            name: 'Store credit',
            description: null,
            type: 'store_credit',
            session_required: false,
            source_required: false,
          },
        },
      ],
    }
    const client = createClient({
      baseUrl: 'https://api.example.com',
      publishableKey: 'pk_test',
      retry: false,
      fetch: async () =>
        new Response(
          JSON.stringify(cart, (key: string, value: unknown) =>
            key.startsWith('display_') ? undefined : value,
          ),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    })
    const resource = await client.carts.get(baseCart.id)
    const mapped = mapSpreeCheckoutToOrder(resource, { locale: 'de' })
    expect(mapped.fulfillments?.[0].displayCost).toBeNull()
    expect(mapped.payments?.[0].displayAmount).toBe('1,23\u00a0$')
    expect(mapped.payments?.[0].sourceLabel).toBe('Store credit')
  })

  it('maps canonical addresses without deprecated aliases', () => {
    const canonicalAddress: Record<string, unknown> = { ...address() }
    delete canonicalAddress.country_iso
    delete canonicalAddress.state_abbr
    delete canonicalAddress.country_name
    assertSpreeCheckoutAddressResponse(canonicalAddress)

    expect(
      mapSpreeCheckoutToOrder(
        {
          ...baseCart,
          shipping_address: canonicalAddress,
        },
        { locale: 'fr' },
      ).shippingAddress,
    ).toMatchObject({
      countryIso: 'US',
      countryName: 'États-Unis',
      stateAbbr: 'CA',
    })
  })

  it.each(['country_code', 'state_code'])(
    'rejects an address missing %s despite populated aliases',
    (field) => {
      expect(() =>
        assertSpreeCheckoutAddressResponse({
          ...address(),
          [field]: undefined,
        }),
      ).toThrow('cart response is malformed')
    },
  )

  it('projects a valid provider client secret without exposing other external data', () => {
    const session = {
      external_data: {
        client_secret: ' pi_secret_123 ',
        customer_external_id: 'cus_private',
      },
      id: 'ps_123',
      status: 'pending',
    } satisfies Pick<SpreePaymentSession, 'id' | 'status' | 'external_data'>

    expect(mapSpreePaymentSession(session)).toEqual({
      id: 'ps_123',
      providerData: { clientSecret: 'pi_secret_123' },
      status: 'pending',
    })
  })

  it.each([null, [], 'malformed'])(
    'projects malformed provider data as an unavailable client secret: %o',
    (externalData) => {
      expect(
        mapSpreePaymentSession({
          external_data: externalData,
          id: 'ps_123',
          status: 'pending',
        }),
      ).toMatchObject({
        id: 'ps_123',
        providerData: { clientSecret: null },
      })
    },
  )

  it('maps checkout-only addresses, payment methods, and requirements', () => {
    const checkoutCart = {
      ...baseCart,
      amount_due: '51.20',
      billing_address: address({
        address1: '5 Billing Ave',
        id: 'addr-bill',
        is_default_billing: true,
        is_default_shipping: false,
      }),
      email: 'customer@example.com',
      payment_methods: [
        {
          description: null,
          id: 'pm-1',
          name: 'Stripe',
          session_required: true,
          source_required: true,
          type: 'SpreeStripe::Gateway',
        },
      ],
      requirements: [
        {
          code: 'shipping_address_required',
          field: 'shipping_address',
          message: 'Select a shipping method',
          step: 'delivery',
        },
      ],
      shipping_address: address(),
      shipping_eq_billing_address: false,
    } satisfies SpreeCart

    const order = mapSpreeCheckoutToOrder(checkoutCart, { locale: 'en' })

    expect(order).toMatchObject({
      amountDue: { amount: 51.2, currencyCode: 'USD' },
      billingAddress: {
        address1: '5 Billing Ave',
        countryIso: 'US',
        fullName: 'Theresa Chavez',
        stateAbbr: 'CA',
      },
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
    expect(order).not.toHaveProperty('token')
    expect(order).not.toHaveProperty('market_id')
  })

  it('keeps unavailable checkout amounts and addresses explicit', () => {
    const order = mapSpreeCheckoutToOrder(
      {
        ...baseCart,
        amount_due: null,
        billing_address: null,
        shipping_address: null,
      },
      { locale: 'en' },
    )

    expect(order.amountDue).toBeNull()
    expect(order.billingAddress).toBeNull()
    expect(order.shippingAddress).toBeNull()
  })

  it('keeps the active cart handle separate from an order serializer id', () => {
    const order = mapSpreeCheckoutToOrder(
      {
        ...baseCart,
        id: 'or_123',
      } satisfies SpreeCart,
      { locale: 'en', cartIdOverride: 'cart_123' },
    )

    expect(order.id).toBe('cart_123')
    expect(order.orderResourceId).toBe('or_123')
  })

  it('rejects a malformed payment array before checkout projection', () => {
    expect(() =>
      mapSpreeCheckoutToOrder(
        {
          ...baseCart,
          payments: null,
        } as unknown as SpreeCart,
        { locale: 'en' },
      ),
    ).toThrow('cart response is malformed')
  })

  it('rejects a payment whose nested method does not match its method identity', () => {
    expect(() =>
      mapSpreeCheckoutToOrder(
        {
          ...baseCart,
          payments: [
            {
              amount: '51.20',
              display_amount: '$51.20',
              id: 'pay-1',
              number: 'P123',
              payment_method: {
                description: null,
                id: 'pm-other',
                name: 'Other',
                session_required: false,
                source_required: false,
                type: 'Spree::PaymentMethod::Check',
              },
              payment_method_id: 'pm-check',
              response_code: null,
              source: null,
              source_id: null,
              source_type: null,
              status: 'completed',
            },
          ],
        },
        { locale: 'en' },
      ),
    ).toThrow('cart response is malformed')
  })

  it.each([
    {
      source: {
        amount_remaining: '20.00',
        display_amount_remaining: '$20.00',
        id: 'credit-1',
      },
      source_type: 'credit_card',
    },
    {
      source: {
        brand: 'visa',
        id: 'card-1',
        last4: '4242',
      },
      source_type: 'store_credit',
    },
  ])(
    'rejects a payment whose source type does not match its source shape',
    ({ source, source_type }) => {
      expect(() =>
        mapSpreeCheckoutToOrder(
          {
            ...baseCart,
            payments: [
              {
                amount: '51.20',
                display_amount: '$51.20',
                id: 'pay-1',
                number: 'P123',
                payment_method: {
                  description: null,
                  id: 'pm-check',
                  name: 'Check',
                  session_required: false,
                  source_required: false,
                  type: 'Spree::PaymentMethod::Check',
                },
                payment_method_id: 'pm-check',
                response_code: null,
                source,
                source_id: source.id,
                source_type,
                status: 'completed',
              },
            ],
          } as unknown as SpreeCart,
          { locale: 'en' },
        ),
      ).toThrow('cart response is malformed')
    },
  )

  it('rejects a payment whose source id does not match its nested source', () => {
    expect(() =>
      mapSpreeCheckoutToOrder(
        {
          ...baseCart,
          payments: [
            {
              amount: '51.20',
              display_amount: '$51.20',
              id: 'pay-1',
              number: 'P123',
              payment_method: {
                description: null,
                id: 'pm-check',
                name: 'Check',
                session_required: false,
                source_required: false,
                type: 'Spree::PaymentMethod::Check',
              },
              payment_method_id: 'pm-check',
              response_code: null,
              source: {
                brand: 'visa',
                id: 'card-current',
                last4: '4242',
              },
              source_id: 'card-other',
              source_type: 'credit_card',
              status: 'completed',
            },
          ],
        } as unknown as SpreeCart,
        { locale: 'en' },
      ),
    ).toThrow('cart response is malformed')
  })

  it.each([
    'current_step',
    'completed_steps',
    'shipping_eq_billing_address',
    'payment_methods',
    'requirements',
  ] as const)(
    'rejects a checkout response with only %s before projection',
    (missingField) => {
      const response = { ...baseCart } as Record<string, unknown>
      delete response[missingField]

      expect(() =>
        mapSpreeCheckoutToOrder(response as unknown as SpreeCart, {
          locale: 'en',
        }),
      ).toThrow('cart response is malformed')
    },
  )

  it('rejects a fractional fulfillment quantity before checkout projection', () => {
    expect(() =>
      mapSpreeCheckoutToOrder(
        {
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
        { locale: 'en' },
      ),
    ).toThrow('cart response is malformed')
  })

  it('projects a multi-seller order group as one truthful checkout summary', () => {
    const firstOrder = {
      ...baseCart,
      cart_id: 'cart_multi_seller',
      completed_at: '2026-09-26T08:00:00Z',
      id: 'or-seller-one',
    } as unknown as SpreeOrder
    const secondOrder = {
      ...baseCart,
      cart_id: 'cart_multi_seller',
      completed_at: '2026-09-26T08:00:00Z',
      id: 'or-seller-two',
      items: baseCart.items.map((item) => ({
        ...item,
        id: 'line-2',
        name: 'Ceramic Mug',
        quantity: 1,
        total: '24.00',
        total_quantity: 1,
      })),
      total_quantity: 1,
    } as unknown as SpreeOrder
    const group = {
      amount_due: '0.00',
      display_amount_due: '$0.00',
      discount_total: '0.00',
      display_discount_total: '$0.00',
      tax_total: '6.40',
      display_tax_total: '$6.40',
      included_tax_total: '0.00',
      display_included_tax_total: '$0.00',
      additional_tax_total: '6.40',
      display_additional_tax_total: '$6.40',
      delivery_total: '0.00',
      display_delivery_total: '$0.00',
      fee_total: '0.00',
      display_fee_total: '$0.00',
      gift_card_total: '0.00',
      display_gift_card_total: '$0.00',
      store_credit_total: '0.00',
      display_store_credit_total: '$0.00',
      covered_by_store_credit: false,
      payments: [],
      billing_address: null,
      completed_at: '2026-09-26T08:00:00Z',
      currency: 'USD',
      display_item_total: '$72.00',
      display_total: '$102.40',
      email: 'customer@example.com',
      fulfillment_status: 'partial',
      id: 'ogrp_multi_seller',
      item_total: '72.00',
      number: 'R-multi-seller',
      orders: [firstOrder, secondOrder],
      payment_status: 'paid',
      shipping_address: null,
      total: '102.40',
    } satisfies SpreeOrderGroup

    const order = mapSpreeOrderGroupToCheckoutOrder(group, { locale: 'en' })

    expect(order.amountDue).toEqual({ amount: 0, currencyCode: 'USD' })
    expect(order.taxTotal).toEqual({ amount: 6.4, currencyCode: 'USD' })
    const paidGroup = mapSpreeOrderGroupToCheckoutOrder(
      {
        ...group,
        payments: [
          {
            amount: '102.40',
            display_amount: '$102.40',
            id: 'py_group',
            number: 'P-GROUP',
            payment_method_id: 'pm_bank',
            payment_method: {
              id: 'pm_bank',
              name: 'Bank transfer',
              description: null,
              type: 'bank_transfer',
              session_required: false,
              source_required: false,
            },
            response_code: null,
            source: null,
            source_id: null,
            source_type: null,
            status: 'completed',
          },
        ],
      },
      { locale: 'en' },
    )
    expect(paidGroup.payments).toEqual([
      {
        displayAmount: '$102.40',
        id: 'py_group',
        methodName: 'Bank transfer',
        number: 'P-GROUP',
        responseCode: null,
        sourceLabel: null,
        status: 'completed',
      },
    ])
    expect(
      mapSpreeOrderGroupToCheckoutOrder(
        {
          ...group,
          total: null,
          amount_due: null,
        },
        { locale: 'en' },
      ),
    ).toMatchObject({ total: null, amountDue: null })
    expect(() =>
      mapSpreeOrderGroupToCheckoutOrder(
        { ...group, total: '0x10' },
        { locale: 'en' },
      ),
    ).toThrow('order group response is malformed')
    expect(() =>
      mapSpreeOrderGroupToCheckoutOrder(
        {
          ...group,
          payments: [{}],
        } as unknown as SpreeOrderGroup,
        { locale: 'en' },
      ),
    ).toThrow('cart response is malformed')

    expect(order).toMatchObject({
      currencyCode: 'USD',
      email: 'customer@example.com',
      fulfillmentStatus: 'partial',
      id: 'ogrp_multi_seller',
      itemCount: 3,
      itemTotal: { amount: 72, currencyCode: 'USD' },
      number: 'R-multi-seller',
      paymentStatus: 'paid',
      total: { amount: 102.4, currencyCode: 'USD' },
    })
    expect(order.items).toHaveLength(2)
    expect(order.fulfillments).toHaveLength(2)
  })

  it('rejects order groups with mixed currencies', () => {
    const firstOrder = {
      ...baseCart,
      id: 'or-us',
    } as unknown as SpreeOrder
    const secondOrder = {
      ...baseCart,
      currency: 'EUR',
      id: 'or-eu',
    } as unknown as SpreeOrder

    expect(() =>
      mapSpreeOrderGroupToCheckoutOrder(
        {
          ...baseCart,
          completed_at: '2026-10-14T00:00:00Z',
          fulfillment_status: null,
          payment_status: null,
          id: 'ogrp_mixed',
          number: 'R-MIXED',
          orders: [firstOrder, secondOrder],
        },
        { locale: 'en' },
      ),
    ).toThrow('mixed currencies')
  })
})
