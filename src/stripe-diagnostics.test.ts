// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  sanitizeStripeSecrets,
  sanitizeStripeUrl,
} from '../e2e/checkout/stripe-diagnostics'

describe('Stripe browser diagnostics privacy', () => {
  it('keeps only the resource URL, excluding credentials, query, and fragment data', () => {
    expect(
      sanitizeStripeUrl(
        'https://user:password@js.stripe.com/v3/frame.html?key=pk_test_synthetic#apiKey=pk_test_fragment&client_secret=pi_fake_secret_private&referrer=private',
      ),
    ).toBe('https://js.stripe.com/v3/frame.html')
  })

  it('drops encoded parameter names and values without relying on a parameter allowlist', () => {
    expect(
      sanitizeStripeUrl(
        'https://api.stripe.com/v1/elements/sessions?%63lient_secret=sensitive&customer=private',
      ),
    ).toBe('https://api.stripe.com/v1/elements/sessions')
  })

  it('does not echo an unparseable URL', () => {
    expect(sanitizeStripeUrl('invalid pk_test_synthetic')).toBe('[invalid URL]')
  })

  it.each([
    'pk_test_synthetic',
    'sk_live_synthetic',
    'rk_test_synthetic',
    'ek_test_synthetic',
    'whsec_synthetic',
    'pi_synthetic_secret_private',
    'seti_synthetic_secret_private',
  ])('redacts provider credentials from diagnostic text: %s', (credential) =>
    expect(sanitizeStripeSecrets(`Provider failed: ${credential}`)).toBe(
      'Provider failed: [redacted]',
    ),
  )
})
