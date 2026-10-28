import { describe, expect, it } from 'vitest'

import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from './error-message-safety'

describe('user-facing error message safety', () => {
  it('reads trimmed text only from strings and Error instances', () => {
    expect(readErrorMessageText('  Address is invalid  ')).toBe(
      'Address is invalid',
    )
    expect(readErrorMessageText(new Error('  Cart is unavailable  '))).toBe(
      'Cart is unavailable',
    )
    expect(readErrorMessageText('   ')).toBeNull()
    expect(readErrorMessageText({ message: 'untrusted object' })).toBeNull()
    expect(readErrorMessageText(null)).toBeNull()
  })

  it('recognizes backend, framework, credential, and runtime error details', () => {
    for (const message of [
      'PG::ConnectionError: database unavailable',
      'Spree::ApiError: request failed',
      'invalid publishable key',
      'expired API credential',
      'undefined method `id`',
      'sk_test_123456789',
      'Fingerprint has already been taken.',
    ]) {
      expect(isUnsafeErrorMessage(message)).toBe(true)
    }

    expect(isUnsafeErrorMessage('The address could not be saved.')).toBe(false)
  })
})
