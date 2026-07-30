import { describe, expect, it } from 'vitest'

import { mapStorefrontBranding } from './storefront-branding.mapper'

describe('mapStorefrontBranding', () => {
  it('normalizes public branding values and keeps empty optional fields null', () => {
    expect(
      mapStorefrontBranding({
        locale: 'en-US',
        logoUrl: ' https://cdn.example.com/shop.svg ',
        metaDescription: ' Shop description ',
        name: ' Shop ',
        seoTitle: ' Shop online ',
      }),
    ).toEqual({
      locale: 'en-US',
      logoUrl: 'https://cdn.example.com/shop.svg',
      metaDescription: 'Shop description',
      name: 'Shop',
      seoTitle: 'Shop online',
    })

    expect(
      mapStorefrontBranding({
        locale: 'fr',
        logoUrl: '',
        metaDescription: ' ',
        name: ' ',
        seoTitle: null,
      }),
    ).toEqual({
      locale: 'fr',
      logoUrl: null,
      metaDescription: null,
      name: 'Store',
      seoTitle: null,
    })
  })

  it('rejects unsafe logo protocols instead of passing them to the UI', () => {
    expect(
      mapStorefrontBranding({
        locale: 'en',
        logoUrl: 'javascript:alert(1)',
        name: 'Shop',
      }).logoUrl,
    ).toBeNull()

    expect(
      mapStorefrontBranding({
        locale: 'en',
        logoUrl: '/spree.png',
        name: 'Shop',
      }).logoUrl,
    ).toBe('/spree.png')
    expect(
      mapStorefrontBranding({
        locale: 'en',
        logoUrl: '//cdn.example.com/logo.svg',
        name: 'Shop',
      }).logoUrl,
    ).toBeNull()
  })
})
