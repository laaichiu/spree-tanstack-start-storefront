import { describe, expect, it } from 'vitest'

import { isNewsletterPopupRouteExcluded } from './newsletter-popup-eligibility'

describe('isNewsletterPopupRouteExcluded', () => {
  it.each([
    '/us/en/account',
    '/us/en/cart',
    '/us/en/checkout/cart_123',
    '/us/en/newsletter/verify',
  ])('excludes %s', (pathname) => {
    expect(isNewsletterPopupRouteExcluded(pathname)).toBe(true)
  })

  it('allows catalog pages', () => {
    expect(
      isNewsletterPopupRouteExcluded('/us/en/products/drip-coffee-maker'),
    ).toBe(false)
  })
})
