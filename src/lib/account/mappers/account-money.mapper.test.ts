import { createClient, isOrderGroup } from '@spree/sdk'
import type { Customer, GiftCard, Order } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { assertCustomerOrderDetailResponse } from '../utils/order-detail-response'
import { assertCustomerOrderSummaryResponse } from '../utils/order-summary-response'
import { assertCustomerProfileResponse } from '../utils/customer-profile-response'
import { assertCustomerGiftCardResourceIsGiftCard } from '../utils/gift-card-identity'
import { mapSpreeOrderToDetail } from './order.mapper'
import { mapSpreeCustomerToProfile } from './customer.mapper'
import { mapSpreeGiftCardToCustomerGiftCard } from './customer-gift-card.mapper'

function withoutDisplayFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutDisplayFields)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith('display_'))
      .map(([key, child]) => [key, withoutDisplayFields(child)]),
  )
}

function clientFor(resource: unknown) {
  return createClient({
    baseUrl: 'https://api.example.com',
    publishableKey: 'pk_test',
    retry: false,
    fetch: async () =>
      new Response(
        JSON.stringify(
          Array.isArray(resource)
            ? { data: withoutDisplayFields(resource) }
            : withoutDisplayFields(resource),
        ),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      ),
  })
}

const order: Order = {
  ...baseCart,
  id: 'or_money',
  cart_id: 'cart_origin',
  completed_at: '2026-10-01T00:00:00Z',
  email: 'shopper@example.com',
  fulfillment_status: 'unfulfilled',
  payment_status: 'paid',
  withdrawal_period_ends_at: null,
  within_withdrawal_period: false,
  total: '90071992547409.12',
  items: baseCart.items.map((item) => ({
    ...item,
    id: 'li_money',
    variant_id: 'variant_money',
    price: '1.2345',
  })),
  fulfillments: [],
  payments: [
    {
      amount: '1.23',
      display_amount: 'OBSOLETE',
      id: 'py_money',
      number: 'P123',
      payment_method_id: 'pm_money',
      response_code: null,
      source: null,
      source_id: null,
      source_type: null,
      status: 'completed',
      payment_method: {
        id: 'pm_money',
        name: 'Card',
        description: null,
        type: 'stripe',
        session_required: true,
        source_required: true,
      },
    },
  ],
}

describe('account canonical money mapping', () => {
  it('reads canonical SDK order responses and formats the reader locale', async () => {
    const resource = await clientFor(order).orders.get(order.id)
    if (isOrderGroup(resource)) throw new Error('Expected one order')
    assertCustomerOrderSummaryResponse(resource)
    assertCustomerOrderDetailResponse(resource)
    const detail = mapSpreeOrderToDetail(resource, 'de')
    expect(detail.displayTotal).toBe('90.071.992.547.409,12\u00a0$')
    expect(detail.items[0].displayPrice).toBe('1,2345\u00a0$')
    expect(detail.payments[0].displayAmount).toBe('1,23\u00a0$')
  })

  it('keeps explicitly hidden order amounts null', async () => {
    const resource = await clientFor({
      ...order,
      total: null,
      items: order.items.map((item) => ({ ...item, price: null, total: null })),
      payments: order.payments.map((payment) => ({ ...payment, amount: null })),
    }).orders.get(order.id)
    if (isOrderGroup(resource)) throw new Error('Expected one order')
    assertCustomerOrderDetailResponse(resource)
    const detail = mapSpreeOrderToDetail(resource, 'en')
    expect(detail.displayTotal).toBeNull()
    expect(detail.items[0].displayPrice).toBeNull()
    expect(detail.payments[0].displayAmount).toBeNull()
  })

  it('formats customer credit in the selected request currency without display aliases', async () => {
    const customer: Customer = {
      accepts_email_marketing: false,
      addresses: [],
      available_store_credit_total: '1.234',
      customer_groups: [],
      default_billing_address: null,
      default_shipping_address: null,
      display_available_store_credit_total: 'OBSOLETE',
      email: 'shopper@example.com',
      email_marketing_consent_updated_at: null,
      first_name: null,
      full_name: '',
      id: 'cust_money',
      last_name: null,
      newsletter_subscriber: null,
      phone: null,
    }
    const resource = await clientFor(customer).customer.get()
    assertCustomerProfileResponse(resource)
    expect(
      mapSpreeCustomerToProfile(resource, {
        currencyCode: 'KWD',
        locale: 'en-US',
      }).displayAvailableStoreCreditTotal,
    ).toBe('KWD\u00a01.234')
  })

  it('formats zero and hidden gift-card amounts independently', async () => {
    const card: GiftCard = {
      active: true,
      amount: '12.34',
      amount_authorized: '0.00',
      amount_remaining: null,
      amount_used: '0.00',
      code: 'TEST',
      currency: 'EUR',
      display_amount: 'OBSOLETE',
      display_amount_remaining: 'OBSOLETE',
      display_amount_used: 'OBSOLETE',
      expired: false,
      expires_at: null,
      id: 'gc_money',
      redeemed_at: null,
      status: 'active',
    }
    const response = await clientFor([card]).customer.giftCards.list()
    assertCustomerGiftCardResourceIsGiftCard(response.data[0])
    const mapped = mapSpreeGiftCardToCustomerGiftCard(response.data[0], 'de')
    expect(mapped.displayAmount).toBe('12,34\u00a0€')
    expect(mapped.displayAmountRemaining).toBeNull()
    expect(mapped.displayAmountUsed).toBe('0,00\u00a0€')
  })
})
