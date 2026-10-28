import { describe, expect, it } from 'vitest'

import { formatSpreeMoney } from './spree-money'

describe('canonical money display', () => {
  const context = { currencyCode: 'USD', locale: 'en-US' }

  it('preserves exact decimal unit prices without a floating-point conversion', () => {
    expect(
      formatSpreeMoney('90071992547409.1234', context, { unitPrice: true }),
    ).toBe('$90,071,992,547,409.1234')
  })

  it('distinguishes hidden money from zero and formats the reader locale', () => {
    expect(formatSpreeMoney(null, context)).toBeNull()
    expect(formatSpreeMoney('0.00', context)).toBe('$0.00')
    expect(
      formatSpreeMoney('1.234', { currencyCode: 'KWD', locale: 'en-US' }),
    ).toBe('KWD\u00a01.234')
    expect(
      formatSpreeMoney('12.34', { currencyCode: 'EUR', locale: 'de' }),
    ).toBe('12,34\u00a0€')
  })

  it.each(['', '$12.00', '1e2', '0x10', 'NaN', '12.00junk'])(
    'rejects malformed amounts before formatting: %s',
    (amount) =>
      expect(() => formatSpreeMoney(amount, context)).toThrow(
        'money response is malformed',
      ),
  )
})
