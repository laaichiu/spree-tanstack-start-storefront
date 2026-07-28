import { describe, expect, it } from 'vitest'

import {
  parseSitemapPart,
  renderSitemapResponse,
  resolveSitemapPublicUrl,
} from './sitemap-response'

const catalogs = [
  {
    categories: [],
    country: 'us',
    locale: 'en',
    products: [],
  },
]

describe('sitemap response contract', () => {
  it('parses index, shard, and invalid requests explicitly', () => {
    expect(parseSitemapPart('https://shop.example.com/sitemap.xml')).toEqual({
      kind: 'index',
    })
    expect(
      parseSitemapPart('https://shop.example.com/sitemap.xml?part=2'),
    ).toEqual({ kind: 'shard', number: 2 })
    expect(
      parseSitemapPart('https://shop.example.com/sitemap.xml?part=0'),
    ).toEqual({ kind: 'invalid' })
    expect(
      parseSitemapPart('https://shop.example.com/sitemap.xml?part=oops'),
    ).toEqual({ kind: 'invalid' })
  })

  it('uses the request origin when no public storefront URL is configured', () => {
    expect(
      resolveSitemapPublicUrl(
        'https://preview.example.com/sitemap.xml',
        '/',
        null,
      ),
    ).toBe('https://preview.example.com/')
  })

  it('returns a 404 response for an unknown shard', async () => {
    const response = renderSitemapResponse({
      catalogs,
      part: { kind: 'shard', number: 2 },
      storefrontUrl: 'https://shop.example.com',
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Not found')
  })

  it('renders an unsharded sitemap response for a small catalog', async () => {
    const response = renderSitemapResponse({
      catalogs,
      part: { kind: 'index' },
      storefrontUrl: 'https://shop.example.com',
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/xml')
    expect(await response.text()).toContain('<urlset')
  })
})
