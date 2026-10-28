// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toSpreeCountryCode } from './country-code'

describe('Spree country request boundary', () => {
  it.each([' us ', 'US', 'cn', 'jp'])(
    'normalizes a supported country: %s',
    (value) => {
      expect(toSpreeCountryCode(value)).toBe(value.trim().toUpperCase())
    },
  )
  it.each(['XX', 'ZZ', 'EU', 'USA', ''])(
    'rejects codes outside the SDK vocabulary: %s',
    (value) => {
      expect(() => toSpreeCountryCode(value)).toThrow('country code is invalid')
    },
  )
})
