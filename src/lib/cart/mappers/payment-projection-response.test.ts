import { describe, expect, it } from 'vitest'

import { assertSpreePaymentProjectionResponse } from './cart-projection-response'

const payment = {
  id: 'py_wallet',
  amount: '10.00',
  number: 'P123',
  response_code: null,
  status: 'completed',
  payment_method_id: 'pm_wallet',
  payment_method: {
    id: 'pm_wallet',
    name: 'Wallet',
    description: null,
    type: 'Wallet',
    session_required: true,
    source_required: true,
  },
  source: { id: 'psrc_wallet', gateway_payment_profile_id: null },
  source_id: 'psrc_wallet',
  source_type: 'payment_source',
}

describe('payment projection source identity', () => {
  it('accepts a canonical non-card source without deprecated money labels', () => {
    expect(() => assertSpreePaymentProjectionResponse(payment)).not.toThrow()
  })

  it.each(['ps_wallet', 'psrc_', 'card_wallet'])(
    'rejects the source id %s',
    (id) => {
      expect(() =>
        assertSpreePaymentProjectionResponse({
          ...payment,
          source_id: id,
          source: { ...payment.source, id },
        }),
      ).toThrow('cart response is malformed')
    },
  )

  it.each([
    { source_id: 'psrc_other' },
    { source: null },
    { source: null, source_type: null },
    { source_id: undefined },
  ])('rejects an inconsistent or missing source identity %j', (patch) => {
    expect(() =>
      assertSpreePaymentProjectionResponse({
        ...payment,
        ...patch,
      }),
    ).toThrow('cart response is malformed')
  })

  it('accepts an explicitly absent source', () => {
    expect(() =>
      assertSpreePaymentProjectionResponse({
        ...payment,
        source: null,
        source_id: null,
        source_type: null,
      }),
    ).not.toThrow()
  })
})
