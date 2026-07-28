import type { CreditCard } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeCreditCardsToCustomerCreditCards } from '@/lib/account/mappers/customer-credit-card.mapper'
import {
  formatCustomerCreditCardBrand,
  formatCustomerCreditCardExpiry,
} from '@/lib/account/model/customer-credit-card'

function buildCreditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  const card: CreditCard = {
    brand: 'visa',
    default: true,
    gateway_payment_profile_id: 'pm_123',
    id: 'card_1',
    last4: '4242',
    month: 9,
    name: 'Theresa Chavez',
    year: 2030,
  }

  return Object.assign(card, overrides)
}

describe('mapSpreeCreditCardsToCustomerCreditCards', () => {
  it('maps Spree credit cards to frontend customer credit card models', () => {
    expect(
      mapSpreeCreditCardsToCustomerCreditCards([buildCreditCard()]),
    ).toEqual([
      {
        brand: 'visa',
        default: true,
        expiryMonth: 9,
        expiryYear: 2030,
        gatewayPaymentProfileId: 'pm_123',
        id: 'card_1',
        last4: '4242',
        name: 'Theresa Chavez',
      },
    ])
  })

  it('normalizes blank optional credit card fields to null', () => {
    const [card] = mapSpreeCreditCardsToCustomerCreditCards([
      buildCreditCard({
        gateway_payment_profile_id: '',
        name: '   ',
      }),
    ])

    expect(card.gatewayPaymentProfileId).toBeNull()
    expect(card.name).toBeNull()
  })

  it('formats normalized credit card display values', () => {
    const [card] = mapSpreeCreditCardsToCustomerCreditCards([buildCreditCard()])

    expect(formatCustomerCreditCardBrand(card.brand)).toBe('VISA')
    expect(formatCustomerCreditCardBrand(' ', 'CARD')).toBe('CARD')
    expect(formatCustomerCreditCardExpiry(card)).toBe('09/2030')
  })
})
