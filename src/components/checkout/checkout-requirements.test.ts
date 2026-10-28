import { describe, expect, it } from 'vitest'

import { getCheckoutSectionElementId } from './checkout-requirements'

describe('getCheckoutSectionElementId', () => {
  it.each([
    ['address', 'checkout-section-address'],
    ['shipping', 'checkout-section-shipping'],
    ['payment', 'checkout-section-payment'],
  ] as const)('maps %s to its scroll target id', (section, id) => {
    expect(getCheckoutSectionElementId(section)).toBe(id)
  })
})
