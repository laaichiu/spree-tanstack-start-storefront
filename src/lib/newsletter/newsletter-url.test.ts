import { describe, expect, it } from 'vitest'

import {
  buildNewsletterVerificationRedirectUrl,
  normalizeNewsletterVerificationRedirectUrl,
} from './newsletter-url'

describe('newsletter-url', () => {
  it('builds a localized verification URL from a safe origin', () => {
    expect(
      buildNewsletterVerificationRedirectUrl({
        country: 'US',
        locale: 'EN',
        origin: 'https://store.example/path',
      }),
    ).toBe('https://store.example/us/en/newsletter/verify')
  })

  it('rejects invalid origin and locale segments', () => {
    expect(
      buildNewsletterVerificationRedirectUrl({
        country: 'usa',
        locale: 'en',
        origin: 'https://store.example',
      }),
    ).toBeUndefined()
    expect(
      buildNewsletterVerificationRedirectUrl({
        country: 'us',
        locale: '../en',
        origin: 'https://store.example',
      }),
    ).toBeUndefined()
    expect(
      buildNewsletterVerificationRedirectUrl({
        country: 'us',
        locale: 'en',
        origin: 'javascript:alert(1)',
      }),
    ).toBeUndefined()
  })

  it('normalizes only same-origin newsletter verification paths', () => {
    expect(
      normalizeNewsletterVerificationRedirectUrl({
        expectedOrigin: 'https://store.example',
        redirectUrl: 'https://store.example/US/EN/newsletter/verify?x=1',
      }),
    ).toBe('https://store.example/us/en/newsletter/verify')

    expect(
      normalizeNewsletterVerificationRedirectUrl({
        expectedOrigin: 'https://store.example',
        redirectUrl: 'https://evil.example/us/en/newsletter/verify',
      }),
    ).toBeUndefined()

    expect(
      normalizeNewsletterVerificationRedirectUrl({
        expectedOrigin: 'https://store.example',
        redirectUrl: 'https://store.example/us/en/account/login',
      }),
    ).toBeUndefined()
  })
})
