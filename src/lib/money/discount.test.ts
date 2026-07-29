import { describe, expect, it } from 'vitest'

import { getDiscountPercent } from './discount'

const money = (amount: number, currencyCode = 'USD') => ({
  amount,
  currencyCode,
})

describe('getDiscountPercent', () => {
  it('rounds a valid markdown to a customer-facing whole percentage', () => {
    expect(getDiscountPercent(money(51), money(68))).toBe(25)
    expect(getDiscountPercent(money(69), money(98))).toBe(30)
  })

  it('ignores missing, mismatched, or non-discounted prices', () => {
    expect(getDiscountPercent(null, money(68))).toBeNull()
    expect(getDiscountPercent(money(51), null)).toBeNull()
    expect(getDiscountPercent(money(51, 'EUR'), money(68))).toBeNull()
    expect(getDiscountPercent(money(68), money(68))).toBeNull()
    expect(getDiscountPercent(money(70), money(68))).toBeNull()
  })
})
