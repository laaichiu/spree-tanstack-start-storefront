import { describe, expect, it } from 'vitest'

import {
  assertPaymentMatchesPaymentMethod,
  assertPaymentResourceIsPayment,
  PaymentResourceMethodMismatchError,
  PaymentResourceTypeMismatchError,
} from './payment-identity'

describe('payment resource identity', () => {
  it('accepts a payment resource with the requested payment method', () => {
    expect(() =>
      assertPaymentMatchesPaymentMethod(
        { id: 'pay_123', payment_method_id: 'pm_check' },
        'pm_check',
      ),
    ).not.toThrow()
  })

  it('rejects a non-payment response before method validation', () => {
    expect(() => assertPaymentResourceIsPayment({ id: 'or_123' })).toThrow(
      PaymentResourceTypeMismatchError,
    )
  })

  it('rejects a payment response for another method', () => {
    expect(() =>
      assertPaymentMatchesPaymentMethod(
        { id: 'pay_123', payment_method_id: 'pm_other' },
        'pm_check',
      ),
    ).toThrow(PaymentResourceMethodMismatchError)
  })
})
