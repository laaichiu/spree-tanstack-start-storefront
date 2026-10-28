// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { Price as SpreePrice } from '@spree/sdk'

import {
  mapSpreeCompareAtPriceToMoney,
  mapSpreePriceToMoney,
} from './map-spree-price'

function price(
  amountInCents: number | null,
  compareAtAmountInCents: number | null = null,
  currency: SpreePrice['currency'] = 'USD',
): SpreePrice {
  return {
    amount: amountInCents === null ? null : (amountInCents / 100).toFixed(2),
    amount_in_cents: amountInCents,
    compare_at_amount:
      compareAtAmountInCents === null
        ? null
        : (compareAtAmountInCents / 100).toFixed(2),
    compare_at_amount_in_cents: compareAtAmountInCents,
    currency,
    display_amount:
      amountInCents === null ? null : `$${(amountInCents / 100).toFixed(2)}`,
    display_compare_at_amount:
      compareAtAmountInCents === null
        ? null
        : `$${(compareAtAmountInCents / 100).toFixed(2)}`,
    id: `price-${amountInCents ?? 'missing'}`,
    price_list_id: null,
  }
}

describe('Spree price mapping', () => {
  it('maps decimal amounts and currency to the normalized money contract', () => {
    expect(mapSpreePriceToMoney(price(24999))).toEqual({
      amount: 249.99,
      currencyCode: 'USD',
    })
  })

  it('rejects incomplete price records', () => {
    expect(mapSpreePriceToMoney(price(null))).toBeNull()
    expect(mapSpreePriceToMoney(price(24999, null, null))).toBeNull()
  })

  it.each([
    ['JPY', '2500', 2500],
    ['KWD', '12.345', 12.345],
    ['USD', '0.0001', 0.0001],
  ] as const)(
    'uses the decimal amount for %s without a cents assumption',
    (currency, amount, expected) => {
      expect(mapSpreePriceToMoney({ ...price(1), amount, currency })).toEqual({
        amount: expected,
        currencyCode: currency,
      })
    },
  )

  it('does not compare reference prices across currencies', () => {
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800), price(2400, null, 'EUR')),
    ).toBeUndefined()
  })

  it('prefers a higher resolved price-list original price', () => {
    expect(mapSpreeCompareAtPriceToMoney(price(1800), price(2400))).toEqual({
      amount: 24,
      currencyCode: 'USD',
    })
  })

  it('falls back to the configured compare-at amount', () => {
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800, 2200), price(1600)),
    ).toEqual({ amount: 22, currencyCode: 'USD' })
  })

  it('does not expose incomplete or non-discounting reference prices', () => {
    expect(
      mapSpreeCompareAtPriceToMoney(undefined, price(2400)),
    ).toBeUndefined()
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800, 1700), price(1600)),
    ).toBeUndefined()
    expect(
      mapSpreeCompareAtPriceToMoney(price(1800, 2200, null), price(1600)),
    ).toBeUndefined()
  })
})
