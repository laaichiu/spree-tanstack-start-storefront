// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getCheckoutDiscountBreakdown } from './summary'

describe('checkout discount currency precision', () => {
  it('retains a three-decimal currency discount in the summary', () => {
    const items = getCheckoutDiscountBreakdown({
      appliedDiscounts: [
        {
          id: 'promo_one',
          promotionId: 'promo_one',
          name: 'Promotion',
          code: null,
          description: null,
          amount: { amount: -0.001, currencyCode: 'KWD' },
        },
      ],
      currencyCode: 'KWD',
      discountTotal: { amount: -0.001, currencyCode: 'KWD' },
      shippingDiscountTotal: null,
    })
    expect(items).toHaveLength(1)
    expect(items[0].amount).toEqual({ amount: -0.001, currencyCode: 'KWD' })
  })

  it('classifies a three-decimal shipping discount without rounding it to zero', () => {
    expect(
      getCheckoutDiscountBreakdown({
        appliedDiscounts: [],
        currencyCode: 'KWD',
        discountTotal: { amount: -0.003, currencyCode: 'KWD' },
        shippingDiscountTotal: { amount: -0.003, currencyCode: 'KWD' },
      }),
    ).toEqual([
      {
        id: 'shipping-discount',
        label: null,
        amount: { amount: -0.003, currencyCode: 'KWD' },
        source: 'shipping',
        fallback: 'free_shipping',
      },
    ])
  })

  it('does not create a phantom USD discount from floating-point addition', () => {
    const items = getCheckoutDiscountBreakdown({
      appliedDiscounts: [0.1, 0.2].map((amount, index) => ({
        id: `promo_${index}`,
        promotionId: `promo_${index}`,
        name: 'Promotion',
        description: null,
        code: null,
        amount: { amount: -amount, currencyCode: 'USD' },
      })),
      currencyCode: 'USD',
      discountTotal: { amount: -0.3, currencyCode: 'USD' },
      shippingDiscountTotal: null,
    })
    expect(items).toHaveLength(2)
    expect(items.every((item) => item.source === 'discount')).toBe(true)
  })
})
