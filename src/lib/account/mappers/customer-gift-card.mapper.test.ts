import type { GiftCard } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeGiftCardsToCustomerGiftCards } from '@/lib/account/mappers/customer-gift-card.mapper'

function buildGiftCard(overrides: Partial<GiftCard> = {}): GiftCard {
  const card: GiftCard = {
    active: true,
    amount: '100.0',
    amount_authorized: '0.0',
    amount_remaining: '75.0',
    amount_used: '25.0',
    code: 'GIFT-123',
    currency: 'USD',
    display_amount: '$100.00',
    display_amount_remaining: '$75.00',
    display_amount_used: '$25.00',
    expired: false,
    expires_at: '2026-12-31T00:00:00Z',
    id: 'gc_1',
    redeemed_at: null,
    status: 'partially_used',
  }

  return Object.assign(card, overrides)
}

describe('mapSpreeGiftCardsToCustomerGiftCards', () => {
  it('maps Spree gift cards to frontend customer gift card models', () => {
    expect(mapSpreeGiftCardsToCustomerGiftCards([buildGiftCard()])).toEqual([
      {
        active: true,
        amount: '100.0',
        amountAuthorized: '0.0',
        amountRemaining: '75.0',
        amountUsed: '25.0',
        code: 'GIFT-123',
        currency: 'USD',
        displayAmount: '$100.00',
        displayAmountRemaining: '$75.00',
        displayAmountUsed: '$25.00',
        expired: false,
        expiresAt: '2026-12-31T00:00:00Z',
        id: 'gc_1',
        redeemedAt: null,
        status: 'partially_used',
      },
    ])
  })
})
