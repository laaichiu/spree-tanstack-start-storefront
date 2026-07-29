import { describe, expect, it } from 'vitest'

import type { Price as SpreePrice } from '@spree/sdk'

import { mapSpreeCompareAtPriceToMoney } from './map-spree-price'

function price(
  amountInCents: number,
  compareAtAmountInCents: number | null = null,
): SpreePrice {
  return {
    amount: (amountInCents / 100).toFixed(2),
    amount_in_cents: amountInCents,
    compare_at_amount: compareAtAmountInCents
      ? (compareAtAmountInCents / 100).toFixed(2)
      : null,
    compare_at_amount_in_cents: compareAtAmountInCents,
    currency: 'USD',
    display_amount: `$${(amountInCents / 100).toFixed(2)}`,
    display_compare_at_amount: compareAtAmountInCents
      ? `$${(compareAtAmountInCents / 100).toFixed(2)}`
      : null,
    id: `price-${amountInCents}`,
    price_list_id: null,
  }
}

describe('mapSpreeCompareAtPriceToMoney', () => {
  it('prefers a higher resolved original price', () => {
    expect(mapSpreeCompareAtPriceToMoney(price(1800), price(2400))).toEqual({
      amount: 24,
      currencyCode: 'USD',
    })
  })

  it('uses a configured compare-at amount when the original price is not higher', () => {
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800, 2200), price(1600)),
    ).toEqual({ amount: 22, currencyCode: 'USD' })
  })

  it('does not expose a non-discounting reference price', () => {
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800, 1700), price(1600)),
    ).toBeUndefined()
  })
})
