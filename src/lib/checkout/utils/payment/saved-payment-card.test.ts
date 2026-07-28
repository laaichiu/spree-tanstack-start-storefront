import { describe, expect, it } from 'vitest'

import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'

import {
  getCheckoutSavedPaymentCards,
  getDefaultCheckoutSavedPaymentCard,
  isCheckoutSavedPaymentProfileAvailable,
} from './saved-payment-card'

function card(overrides: Partial<CustomerCreditCard> = {}): CustomerCreditCard {
  return {
    brand: 'visa',
    default: false,
    expiryMonth: 4,
    expiryYear: 2030,
    gatewayPaymentProfileId: 'pm_123',
    id: 'card_123',
    last4: '4242',
    name: null,
    ...overrides,
  }
}

describe('checkout saved payment card helpers', () => {
  it('keeps only cards with a gateway payment profile id', () => {
    expect(
      getCheckoutSavedPaymentCards([
        card({ id: 'card_1', gatewayPaymentProfileId: 'pm_1' }),
        card({ id: 'card_2', gatewayPaymentProfileId: '' }),
        card({ id: 'card_3', gatewayPaymentProfileId: null }),
      ]).map((savedCard) => savedCard.id),
    ).toEqual(['card_1'])
  })

  it('selects the default checkout-capable card before falling back to first', () => {
    expect(
      getDefaultCheckoutSavedPaymentCard([
        card({ default: true, gatewayPaymentProfileId: null, id: 'raw' }),
        card({ gatewayPaymentProfileId: 'pm_1', id: 'first' }),
        card({
          default: true,
          gatewayPaymentProfileId: 'pm_default',
          id: 'default',
        }),
      ])?.id,
    ).toBe('default')

    expect(
      getDefaultCheckoutSavedPaymentCard([
        card({ gatewayPaymentProfileId: 'pm_first', id: 'first' }),
        card({ gatewayPaymentProfileId: 'pm_second', id: 'second' }),
      ])?.id,
    ).toBe('first')
  })

  it('checks whether a selected payment profile still exists', () => {
    const cards = getCheckoutSavedPaymentCards([
      card({ gatewayPaymentProfileId: 'pm_available' }),
    ])

    expect(
      isCheckoutSavedPaymentProfileAvailable({
        cards,
        paymentProfileId: 'pm_available',
      }),
    ).toBe(true)
    expect(
      isCheckoutSavedPaymentProfileAvailable({
        cards,
        paymentProfileId: 'pm_missing',
      }),
    ).toBe(false)
    expect(
      isCheckoutSavedPaymentProfileAvailable({
        cards,
        paymentProfileId: null,
      }),
    ).toBe(false)
  })
})
