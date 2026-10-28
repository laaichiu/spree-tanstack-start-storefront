// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { getDiscountPercent, hasMeaningfulAmount } from './money'

const money = (amount: number, currencyCode = 'USD') => ({
  amount,
  currencyCode,
})

describe('money domain rules', () => {
  it('rounds a valid markdown to a customer-facing whole percentage', () => {
    expect(getDiscountPercent(money(51), money(68))).toBe(25)
    expect(getDiscountPercent(money(69), money(98))).toBe(30)
  })

  it('rejects missing, mismatched, or non-discounting reference prices', () => {
    expect(getDiscountPercent(null, money(68))).toBeNull()
    expect(getDiscountPercent(money(51), null)).toBeNull()
    expect(getDiscountPercent(money(51, 'EUR'), money(68))).toBeNull()
    expect(getDiscountPercent(money(68), money(68))).toBeNull()
    expect(getDiscountPercent(money(70), money(68))).toBeNull()
    expect(getDiscountPercent(money(-1), money(0))).toBeNull()
  })

  it('recognizes finite positive and negative amounts above the display threshold', () => {
    expect(hasMeaningfulAmount(12.5)).toBe(true)
    expect(hasMeaningfulAmount('-12.5')).toBe(true)
    expect(hasMeaningfulAmount(0.0001001)).toBe(true)
  })

  it('rejects empty, invalid, and effectively zero amounts', () => {
    expect(hasMeaningfulAmount(null)).toBe(false)
    expect(hasMeaningfulAmount(undefined)).toBe(false)
    expect(hasMeaningfulAmount('not-a-number')).toBe(false)
    expect(hasMeaningfulAmount(0)).toBe(false)
    expect(hasMeaningfulAmount(0.0001)).toBe(false)
    expect(hasMeaningfulAmount(Infinity)).toBe(false)
  })
})
