import { describe, expect, it } from 'vitest'

import {
  assertPaymentSessionMatchesCart,
  assertPaymentSessionMatchesId,
  assertPaymentSessionMatchesPaymentMethod,
  assertPaymentSessionResourceIsPaymentSession,
  isPaymentSessionResourceId,
  isPaymentSessionResourceIdentityMismatchError,
  isPaymentSessionPaymentMethodIdentityMismatchError,
  PaymentSessionPaymentMethodIdentityMismatchError,
  PaymentSessionResourceIdentityMismatchError,
} from './payment-session-identity'

describe('payment session resource identity', () => {
  it.each(['ps_current', 'ps_123'])(
    'recognizes a valid PaymentSession resource id: %s',
    (id) => {
      expect(isPaymentSessionResourceId(id)).toBe(true)
    },
  )

  it.each([undefined, '', 'ps_'])(
    'rejects an incomplete PaymentSession resource id: %o',
    (id) => {
      expect(isPaymentSessionResourceId(id)).toBe(false)
    },
  )

  it('accepts the requested session identity', () => {
    expect(() =>
      assertPaymentSessionMatchesId({ id: 'ps_current' }, 'ps_current'),
    ).not.toThrow()
  })

  it('accepts a payment session belonging to the requested cart', () => {
    expect(() =>
      assertPaymentSessionMatchesCart(
        { id: 'ps_current', order_id: 'or_current' },
        'cart_current',
      ),
    ).not.toThrow()
  })

  it('accepts an explicit cart identity from a cart-owned response', () => {
    expect(() =>
      assertPaymentSessionMatchesCart(
        { cart_id: 'cart_current', id: 'ps_current', order_id: 'cart_current' },
        'cart_current',
      ),
    ).not.toThrow()
  })

  it('accepts a completed response whose owner has moved to the order', () => {
    expect(() =>
      assertPaymentSessionMatchesCart(
        { cart_id: null, id: 'ps_current', order_id: 'or_completed' },
        'cart_current',
      ),
    ).not.toThrow()
  })

  it('rejects a payment session belonging to another cart', () => {
    expect(() =>
      assertPaymentSessionMatchesCart(
        { cart_id: 'cart_other', id: 'ps_current', order_id: 'or_other' },
        'cart_current',
      ),
    ).toThrow('does not match the requested cart')
  })

  it('accepts a payment session for the requested payment method', () => {
    expect(() =>
      assertPaymentSessionMatchesPaymentMethod(
        { id: 'ps_current', payment_method_id: 'pm_current' },
        'pm_current',
      ),
    ).not.toThrow()
  })

  it.each([undefined, null, 'pm_other'])(
    'rejects a payment session for another or missing payment method: %o',
    (paymentMethodId) => {
      expect(() =>
        assertPaymentSessionMatchesPaymentMethod(
          { id: 'ps_current', payment_method_id: paymentMethodId },
          'pm_current',
        ),
      ).toThrow(PaymentSessionPaymentMethodIdentityMismatchError)
    },
  )

  it('classifies payment-method identity mismatches separately', () => {
    expect(
      isPaymentSessionPaymentMethodIdentityMismatchError(
        new PaymentSessionPaymentMethodIdentityMismatchError(),
      ),
    ).toBe(true)
  })

  it('accepts the provider external identity for provider redirect callbacks', () => {
    expect(() =>
      assertPaymentSessionMatchesId(
        { external_id: 'adyen-session', id: 'ps_current' },
        'adyen-session',
      ),
    ).not.toThrow()
  })

  it('rejects a response for another session', () => {
    expect(() =>
      assertPaymentSessionMatchesId({ id: 'ps_other' }, 'ps_current'),
    ).toThrow(PaymentSessionResourceIdentityMismatchError)

    try {
      assertPaymentSessionMatchesId({ id: 'ps_other' }, 'ps_current')
    } catch (error) {
      expect(isPaymentSessionResourceIdentityMismatchError(error)).toBe(true)
    }
  })

  it('rejects a response whose provider external identity also differs', () => {
    expect(() =>
      assertPaymentSessionMatchesId(
        { external_id: 'adyen-other', id: 'ps_other' },
        'adyen-current',
      ),
    ).toThrow(PaymentSessionResourceIdentityMismatchError)
  })

  it.each([null, 42, { id: undefined }, { id: 'or_order' }, { id: 'ps_' }])(
    'rejects an invalid payment session resource identity: %o',
    (session) => {
      expect(() =>
        assertPaymentSessionResourceIsPaymentSession(session),
      ).toThrow(PaymentSessionResourceIdentityMismatchError)
    },
  )
})
