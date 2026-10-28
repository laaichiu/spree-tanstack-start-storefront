import { describe, expect, it } from 'vitest'

import { redactSensitiveText } from './error-redaction'

describe('error text redaction', () => {
  it('redacts bare payment and setup client secrets as well as named credentials', () => {
    expect(
      redactSensitiveText(
        'pi_example_secret_sensitive seti_example_secret_sensitive sk_test_sensitive token=private Bearer private',
      ),
    ).toBe(
      '[redacted] [redacted] sk_test_[redacted] token=[redacted] Bearer [redacted]',
    )
  })
})
