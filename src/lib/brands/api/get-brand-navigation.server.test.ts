import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'
import type { BrandProfile } from '@/lib/brands/contracts'
import { reportError } from '@/lib/observability/report-error'

import { getBrandForMarket, hasBrandsForMarket } from './get-brands.server'
import { getBrandNavigationForMarket } from './get-brand-navigation.server'

vi.mock('./get-brands.server', () => ({
  getBrandForMarket: vi.fn(),
  hasBrandsForMarket: vi.fn(),
}))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn() }))

const market: ResolvedMarket = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'USD',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_test',
  marketName: 'Test market',
}

function brand(
  slug: string,
  coverPhotoUrl: string | null = null,
): BrandProfile {
  return {
    about: 'Full profile content',
    aboutHtml: '<p>Full profile content</p>',
    coverPhotoUrl,
    id: 'sel_' + slug,
    logoUrl: '/logo.webp',
    name: slug.toUpperCase(),
    slug,
    squareLogoUrl: '/square-logo.webp',
  }
}

describe('getBrandNavigationForMarket', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(hasBrandsForMarket).mockResolvedValue(true)
    vi.mocked(getBrandForMarket).mockImplementation(async ({ slug }) =>
      brand(slug, '/cover.webp'),
    )
  })

  it('preserves curated order, deduplicates requests, and sends only navigation data to the shell', async () => {
    const result = await getBrandNavigationForMarket({
      configuration: {
        slugs: ['beta', 'apple', 'beta'],
        featuredSlug: 'apple',
      },
      market,
    })

    expect(result.items.map((item) => item.slug)).toEqual(['beta', 'apple'])
    expect(result.featuredBrand).toEqual({
      id: 'sel_apple',
      imageUrl: '/cover.webp',
      name: 'APPLE',
      slug: 'apple',
    })
    expect(Object.keys(result.items[0]).sort()).toEqual([
      'id',
      'imageUrl',
      'name',
      'slug',
    ])
    expect(getBrandForMarket).toHaveBeenCalledTimes(2)
    expect(getBrandForMarket).toHaveBeenCalledWith({ market, slug: 'beta' })
    expect(getBrandForMarket).toHaveBeenCalledWith({ market, slug: 'apple' })
    expect(hasBrandsForMarket).toHaveBeenCalledWith({ market })
  })

  it('allows a distinct featured brand without adding it to the curated list', async () => {
    const result = await getBrandNavigationForMarket({
      configuration: { slugs: ['apple'], featuredSlug: 'beta' },
      market,
    })

    expect(result.items.map((item) => item.slug)).toEqual(['apple'])
    expect(result.featuredBrand?.slug).toBe('beta')
  })

  it('omits an unavailable or rejected profile while retaining All Brands and valid links', async () => {
    vi.mocked(getBrandForMarket).mockImplementation(async ({ slug }) => {
      if (slug === 'missing') throw new Error('Rejected profile')
      return brand(slug)
    })
    const result = await getBrandNavigationForMarket({
      configuration: { slugs: ['missing', 'apple'], featuredSlug: 'missing' },
      market,
    })

    expect(result.enabled).toBe(true)
    expect(result.items.map((item) => item.slug)).toEqual(['apple'])
    expect(result.items[0].imageUrl).toBeNull()
    expect(result.featuredBrand).toBeNull()
    expect(reportError).toHaveBeenCalledTimes(1)
  })

  it('treats an empty cover photo as absent', async () => {
    vi.mocked(getBrandForMarket).mockResolvedValue(brand('apple', '  '))
    const result = await getBrandNavigationForMarket({
      configuration: { slugs: ['apple'], featuredSlug: 'apple' },
      market,
    })
    expect(result.featuredBrand?.imageUrl).toBeNull()
  })

  it('keeps navigation available when a curated brand resolves but the presence check fails', async () => {
    vi.mocked(hasBrandsForMarket).mockRejectedValue(
      new Error('Network unavailable'),
    )
    const result = await getBrandNavigationForMarket({
      configuration: { slugs: ['apple'], featuredSlug: null },
      market,
    })
    expect(result.enabled).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(reportError).toHaveBeenCalledTimes(1)
  })

  it('disables navigation when both presence and configured profiles fail', async () => {
    vi.mocked(hasBrandsForMarket).mockRejectedValue(
      new Error('Network unavailable'),
    )
    vi.mocked(getBrandForMarket).mockRejectedValue(
      new Error('Rejected profile'),
    )

    expect(
      await getBrandNavigationForMarket({
        configuration: { slugs: ['apple'], featuredSlug: 'apple' },
        market,
      }),
    ).toEqual({ enabled: false, featuredBrand: null, items: [] })
    expect(getBrandForMarket).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledTimes(2)
  })

  it('does not request profiles when no brands are curated', async () => {
    vi.mocked(hasBrandsForMarket).mockResolvedValue(false)
    expect(
      await getBrandNavigationForMarket({
        configuration: { slugs: [], featuredSlug: null },
        market,
      }),
    ).toEqual({ enabled: false, featuredBrand: null, items: [] })
    expect(getBrandForMarket).not.toHaveBeenCalled()
  })
})
