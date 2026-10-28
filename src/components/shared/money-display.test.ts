import { describe, expect, it } from 'vitest'

import { formatMoney, getMoneyDisplay } from './money-display'

describe('money display precision', () => {
  it.each([
    ['USD', '$1.2345', '$1.23'],
    ['JPY', '¥1.2345', '¥1'],
    ['KWD', 'KWD\u00a01.2345', 'KWD\u00a01.235'],
  ])(
    'distinguishes %s unit prices from totals',
    (currencyCode, unit, total) => {
      const money = { amount: 1.2345, currencyCode }

      expect(formatMoney(money, 'en-US', { unitPrice: true })).toBe(unit)
      expect(formatMoney(money, 'en-US')).toBe(total)
      // Both modes must remain distinct when their cached formatters are reused.
      expect(formatMoney(money, 'en-US', { unitPrice: true })).toBe(unit)
    },
  )

  it('preserves four-decimal sale and compare-at unit prices', () => {
    expect(
      getMoneyDisplay(
        { amount: 1.2345, currencyCode: 'USD' },
        { amount: 2.3456, currencyCode: 'USD' },
        'en-US',
        { unitPrice: true },
      ),
    ).toEqual({ compareAtPriceLabel: '$2.3456', priceLabel: '$1.2345' })
  })

  it('retains currency minimum digits and locale separators', () => {
    expect(
      formatMoney({ amount: 1.2, currencyCode: 'USD' }, 'en-US', {
        unitPrice: true,
      }),
    ).toBe('$1.20')
    expect(
      formatMoney({ amount: 1.2345, currencyCode: 'EUR' }, 'de', {
        unitPrice: true,
      }),
    ).toBe('1,2345\u00a0€')
  })

  it('distinguishes zero from hidden prices and keeps slider overrides', () => {
    expect(formatMoney(null, 'en-US', { unitPrice: true })).toBe('—')
    expect(
      formatMoney({ amount: 0, currencyCode: 'USD' }, 'en-US', {
        unitPrice: true,
      }),
    ).toBe('$0.00')
    expect(
      formatMoney({ amount: 1.2345, currencyCode: 'USD' }, 'en-US', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }),
    ).toBe('$1')
  })
})
