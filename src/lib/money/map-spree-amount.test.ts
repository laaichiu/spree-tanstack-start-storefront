// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { mapSpreeAmountToMoney } from './map-spree-amount'

describe('mapSpreeAmountToMoney', () => {
  it('maps decimal strings without changing the API currency', () => {
    expect(mapSpreeAmountToMoney('249.99', 'USD')).toEqual({
      amount: 249.99,
      currencyCode: 'USD',
    })
    expect(mapSpreeAmountToMoney('-12.50', 'EUR')).toEqual({
      amount: -12.5,
      currencyCode: 'EUR',
    })
  })

  it('preserves nullable Store API amounts', () => {
    expect(mapSpreeAmountToMoney(null, 'USD')).toBeNull()
  })

  it.each(['not-a-number', '12.34garbage', '   ', 'Infinity', '0x10', '1e3'])(
    'fails closed when Spree returns an invalid amount: %s',
    (amount) => {
      expect(() => mapSpreeAmountToMoney(amount, 'USD')).toThrow(
        'Spree money amount is invalid',
      )
    },
  )

  it('accepts surrounding whitespace without accepting malformed suffixes', () => {
    expect(mapSpreeAmountToMoney(' 12.34 ', 'USD')).toEqual({
      amount: 12.34,
      currencyCode: 'USD',
    })
  })
})
