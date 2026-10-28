import { describe, expect, it } from 'vitest'

import { getCheckoutAppliedCodePresentations } from './checkout-applied-code-display'

describe('getCheckoutAppliedCodePresentations', () => {
  it('uses the cart coupon for removal while retaining the promotion label', () => {
    const [discount] = getCheckoutAppliedCodePresentations({
      cart: {
        appliedDiscounts: [
          {
            amount: { amount: -5, currencyCode: 'USD' },
            code: '10OFF',
            description: null,
            id: 'adjustment-1',
            name: '10OFF',
            promotionId: 'promotion-1',
          },
        ],
        appliedGiftCard: null,
        couponCode: 'generated-10off',
      },
      locale: 'en-US',
    })

    expect(discount).toMatchObject({
      code: 'generated-10off',
      label: '10OFF',
    })
  })
})
