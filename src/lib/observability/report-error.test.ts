import { describe, expect, it, vi } from 'vitest'

import {
  buildStorefrontErrorEvent,
  getSafeErrorSummary,
  isBrowserFetchFailureError,
  reportError,
  redactSensitiveText,
} from './report-error'

describe('observability error helpers', () => {
  it('recognizes browser fetch failures', () => {
    expect(isBrowserFetchFailureError(new TypeError('Failed to fetch'))).toBe(
      true,
    )
  })

  it('does not treat other errors as browser fetch failures', () => {
    expect(isBrowserFetchFailureError(new TypeError('Network failed'))).toBe(
      false,
    )
    expect(isBrowserFetchFailureError(new Error('Failed to fetch'))).toBe(false)
    expect(isBrowserFetchFailureError('Failed to fetch')).toBe(false)
  })

  it('redacts provider keys, authorization headers, and named secrets', () => {
    expect(
      redactSensitiveText(
        'Bearer ey.test.token sk_test_123456 api_key=private client_secret: pi_secret password=hunter2',
      ),
    ).toBe(
      'Bearer [redacted] sk_test_[redacted] api_key=[redacted] client_secret: [redacted] password=[redacted]',
    )
    expect(redactSensitiveText('authorization: Basic dXNlcjpwYXNz')).toBe(
      'authorization: [redacted]',
    )
  })

  it('summarizes errors without retaining arbitrary objects or secrets', () => {
    expect(
      getSafeErrorSummary(
        new Error('Request failed with token=private-token-value'),
      ),
    ).toBe('Error: Request failed with token=[redacted]')
    expect(
      getSafeErrorSummary({
        code: 'api_key_expired',
        message: 'Rejected sk_live_123456789',
      }),
    ).toBe('Rejected sk_live_[redacted]: code=api_key_expired')
    expect(getSafeErrorSummary({ payload: 'not logged' })).toBe(
      'Non-Error object thrown',
    )
  })

  it('builds a bounded, allowlisted structured event', () => {
    expect(
      buildStorefrontErrorEvent({
        code: 'payment_failed',
        context: 'checkout.payment',
        error: new Error('Stripe token=private-token-value'),
        routeId: 'checkout-product',
        surface: 'checkout',
      }),
    ).toEqual({
      code: 'payment_failed',
      context: 'checkout.payment',
      event: 'storefront.error',
      routeId: 'checkout-product',
      summary: 'Error: Stripe token=[redacted]',
      surface: 'checkout',
    })
  })

  it('writes structured server events without leaking the original error object', () => {
    vi.stubGlobal('window', undefined)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    reportError({
      context: 'checkout.payment',
      error: new Error('Payment failed with token=private-token'),
    })

    expect(consoleError).toHaveBeenCalledWith(
      JSON.stringify({
        context: 'checkout.payment',
        event: 'storefront.error',
        summary: 'Error: Payment failed with token=[redacted]',
        source: 'server',
      }),
    )
    consoleError.mockRestore()
    vi.unstubAllGlobals()
  })
})
