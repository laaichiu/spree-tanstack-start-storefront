import { describe, expect, it } from 'vitest'

import type { CartSummaryAmounts } from '@/lib/cart/contracts'
import { getCartDrawerFooterPresentation } from './cart-drawer-footer-display'

const amounts: CartSummaryAmounts = {
  discount: null,
  itemTotal: { amount: 10, currencyCode: 'USD' },
  shipping: null,
  tax: null,
  total: { amount: 10, currencyCode: 'USD' },
}

const labels = {
  calculatedAtCheckout: 'Calculated at checkout',
  free: 'Free',
}

describe('getCartDrawerFooterPresentation', () => {
  it.each([
    {
      expected: 'Calculated at checkout',
      shippingSummary: { kind: 'calculated' as const },
    },
    { expected: 'Free', shippingSummary: { kind: 'free' as const } },
    {
      expected: '$5.00',
      shippingSummary: {
        amount: { amount: 5, currencyCode: 'USD' },
        kind: 'amount' as const,
      },
    },
  ])(
    'formats shipping state as "$expected"',
    ({ expected, shippingSummary }) => {
      const presentation = getCartDrawerFooterPresentation({
        amounts,
        labels,
        locale: 'en-US',
        shippingSummary,
      })

      expect(presentation.shipping).toBe(expected)
    },
  )
})
