import { describe, expect, it } from 'vitest'

import { parseCheckoutPaymentReturnSearch } from './payment-return'

describe('parseCheckoutPaymentReturnSearch', () => {
  it('keeps Stripe and session result return params', () => {
    expect(
      parseCheckoutPaymentReturnSearch({
        session: 'ps_123',
        sessionResult: 'approved_payload',
      }),
    ).toEqual({
      redirectResult: undefined,
      session: 'ps_123',
      sessionId: undefined,
      sessionResult: 'approved_payload',
    })
  })

  it('keeps Adyen redirect return params', () => {
    expect(
      parseCheckoutPaymentReturnSearch({
        redirectResult: 'adyen_redirect_payload',
        sessionId: 'adyen_session_123',
      }),
    ).toMatchObject({
      redirectResult: 'adyen_redirect_payload',
      sessionId: 'adyen_session_123',
    })
  })

  it('ignores empty and non-string provider params', () => {
    expect(
      parseCheckoutPaymentReturnSearch({
        redirectResult: '',
        session: '   ',
        sessionId: ['ps_123'],
        sessionResult: 123,
      }),
    ).toEqual({
      redirectResult: undefined,
      session: undefined,
      sessionId: undefined,
      sessionResult: undefined,
    })
  })
})
