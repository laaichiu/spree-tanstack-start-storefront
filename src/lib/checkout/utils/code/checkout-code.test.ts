import { describe, expect, it } from 'vitest'

import {
  readCheckoutCodeErrorMessage,
  shouldPreferDiscountCodeErrorAfterGiftCardError,
  shouldTryGiftCardAfterDiscountCodeError,
} from './checkout-code'

describe('checkout code fallback', () => {
  it('tries gift cards only after not-found or validation discount code errors', () => {
    expect(shouldTryGiftCardAfterDiscountCodeError({ status: 404 })).toBe(true)
    expect(shouldTryGiftCardAfterDiscountCodeError({ status: 422 })).toBe(true)
    expect(shouldTryGiftCardAfterDiscountCodeError({ status: 500 })).toBe(false)
  })

  it('keeps the discount code error when the gift card is also not found', () => {
    expect(
      shouldPreferDiscountCodeErrorAfterGiftCardError({
        code: 'gift_card_not_found',
      }),
    ).toBe(true)
    expect(
      shouldPreferDiscountCodeErrorAfterGiftCardError({
        code: 'gift_card_expired',
      }),
    ).toBe(false)
  })

  it('normalizes unknown checkout code errors', () => {
    expect(readCheckoutCodeErrorMessage(new Error('Invalid code'))).toBe(
      'Invalid code',
    )
    expect(readCheckoutCodeErrorMessage('nope')).toBe(
      'The entered code is not valid.',
    )
  })
})
