import { describe, expect, it } from 'vitest'

import {
  MAX_SITEMAP_URLS,
  buildSitemapEntries,
  chunkSitemapEntries,
  renderRobotsTxt,
  renderSitemapIndex,
  renderSitemapXml,
} from './site-indexing'

describe('site indexing', () => {
  it('builds localized catalog URLs and deduplicates repeated resources', () => {
    const entries = buildSitemapEntries(
      [
        {
          categories: [
            { permalink: 'kitchen/coffee & tea' },
            { permalink: 'kitchen/coffee & tea' },
          ],
          country: 'us',
          locale: 'en',
          products: [
            {
              imageUrl:
                'https://cdn.example.com/product.jpg?width=1200&fit=cover',
              slug: 'everyday bowl',
            },
            {
              imageUrl: null,
              slug: 'everyday bowl',
            },
          ],
        },
      ],
      'https://shop.example.com',
    )

    expect(entries).toEqual([
      {
        changeFrequency: 'daily',
        loc: 'https://shop.example.com/us/en',
        priority: '1.0',
      },
      {
        changeFrequency: 'daily',
        loc: 'https://shop.example.com/us/en/products',
        priority: '0.8',
      },
      {
        changeFrequency: 'weekly',
        imageUrl: 'https://cdn.example.com/product.jpg?width=1200&fit=cover',
        loc: 'https://shop.example.com/us/en/products/everyday%20bowl',
        priority: '0.7',
      },
      {
        changeFrequency: 'weekly',
        loc: 'https://shop.example.com/us/en/collections/kitchen/coffee%20%26%20tea',
        priority: '0.6',
      },
    ])
  })

  it('renders valid XML with escaped image query parameters', () => {
    const xml = renderSitemapXml([
      {
        changeFrequency: 'weekly',
        imageUrl: 'https://cdn.example.com/product.jpg?width=1200&fit=cover',
        loc: 'https://shop.example.com/us/en/products/bowl',
        priority: '0.7',
      },
    ])

    expect(xml).toContain(
      '<image:loc>https://cdn.example.com/product.jpg?width=1200&amp;fit=cover</image:loc>',
    )
    expect(xml).toContain('xmlns:image=')
    expect(xml.endsWith('\n')).toBe(true)
  })

  it('preserves every URL when the catalog requires sitemap shards', () => {
    const entries = buildSitemapEntries(
      [
        {
          categories: [],
          country: 'us',
          locale: 'en',
          products: Array.from(
            { length: MAX_SITEMAP_URLS + 1 },
            (_, index) => ({
              imageUrl: null,
              slug: `product-${index}`,
            }),
          ),
        },
      ],
      'https://shop.example.com',
    )
    const chunks = chunkSitemapEntries(entries)

    expect(entries).toHaveLength(MAX_SITEMAP_URLS + 3)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(MAX_SITEMAP_URLS)
    expect(chunks[1]).toHaveLength(3)
    expect(chunks.flat()).toHaveLength(entries.length)
  })

  it('handles empty and exact-boundary sitemap chunks', () => {
    expect(chunkSitemapEntries([])).toEqual([])

    const entries = Array.from({ length: 4 }, (_, index) => ({
      changeFrequency: 'weekly' as const,
      loc: `https://shop.example.com/products/${index}`,
      priority: '0.7',
    }))

    expect(chunkSitemapEntries(entries, 2)).toEqual([
      entries.slice(0, 2),
      entries.slice(2),
    ])
  })

  it('rejects invalid sitemap chunk sizes', () => {
    expect(() => chunkSitemapEntries([], 0)).toThrow(
      'Sitemap chunk size must be a positive safe integer',
    )
    expect(() => chunkSitemapEntries([], 1.5)).toThrow(
      'Sitemap chunk size must be a positive safe integer',
    )
  })

  it('renders a sitemap index with escaped shard URLs', () => {
    const xml = renderSitemapIndex([
      'https://shop.example.com/sitemap.xml?part=1&market=default',
    ])

    expect(xml).toContain('<sitemapindex')
    expect(xml).toContain(
      '<loc>https://shop.example.com/sitemap.xml?part=1&amp;market=default</loc>',
    )
    expect(xml.endsWith('\n')).toBe(true)
  })

  it('renders private storefront paths and the sitemap directive in robots.txt', () => {
    const robots = renderRobotsTxt('https://shop.example.com/sitemap.xml')

    expect(robots).toContain('Disallow: /*/*/account')
    expect(robots).toContain('Disallow: /*?*q=*')
    expect(robots).toContain('Sitemap: https://shop.example.com/sitemap.xml')
    expect(robots.endsWith('\n')).toBe(true)
  })
})
