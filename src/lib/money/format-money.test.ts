import { describe, expect, it } from 'vitest'

import { formatMoney } from './format-money'

describe('formatMoney', () => {
  it('formats a normalized money value for the requested locale', () => {
    expect(
      formatMoney(
        {
          amount: 1234.5,
          currencyCode: 'USD',
        },
        'en-US',
      ),
    ).toBe('$1,234.50')
  })

  it('supports whole-number labels without duplicating currency formatters', () => {
    expect(
      formatMoney(
        {
          amount: 50,
          currencyCode: 'USD',
        },
        'en-US',
        {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        },
      ),
    ).toBe('$50')
  })
})
