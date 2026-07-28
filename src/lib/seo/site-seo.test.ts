import { describe, expect, it } from 'vitest'

import {
  buildCanonicalUrl,
  buildSeoHead,
  buildSeoImageUrl,
  buildSeoMeta,
} from './site-seo'

describe('buildSeoMeta', () => {
  it('builds shared search and social metadata', () => {
    expect(
      buildSeoMeta({
        description: 'A product description',
        ogType: 'product',
        title: 'Product name',
      }),
    ).toEqual(
      expect.arrayContaining([
        { title: 'Product name' },
        { content: 'A product description', name: 'description' },
        { content: 'Product name', property: 'og:title' },
        { content: 'product', property: 'og:type' },
      ]),
    )
  })

  it('marks private flows as non-indexable', () => {
    expect(
      buildSeoMeta({
        description: 'Checkout description',
        noIndex: true,
        title: 'Checkout',
      }),
    ).toContainEqual({ content: 'noindex, nofollow', name: 'robots' })
  })

  it('builds canonical and social URLs from an explicit storefront URL', () => {
    const canonicalUrl = buildCanonicalUrl(
      '/us/en/products?page=2#products',
      'https://shop.example.com/',
    )
    const imageUrl = buildSeoImageUrl(
      '/hero-1600.webp',
      'https://shop.example.com/',
    )

    expect(canonicalUrl).toBe('https://shop.example.com/us/en/products?page=2')
    expect(imageUrl).toBe('https://shop.example.com/hero-1600.webp')
    expect(
      buildSeoHead({
        canonicalUrl,
        description: 'Browse products',
        image: imageUrl ? { alt: 'Storefront hero', url: imageUrl } : null,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
          },
        ],
        title: 'Products',
      }),
    ).toEqual(
      expect.objectContaining({
        links: [
          {
            href: 'https://shop.example.com/us/en/products?page=2',
            rel: 'canonical',
          },
        ],
        meta: expect.arrayContaining([
          {
            content: 'https://shop.example.com/hero-1600.webp',
            property: 'og:image',
          },
          { content: 'summary_large_image', name: 'twitter:card' },
        ]),
        scripts: [
          {
            children: '{"@context":"https://schema.org","@type":"WebPage"}',
            type: 'application/ld+json',
          },
        ],
      }),
    )
  })

  it('escapes HTML-like content in structured data scripts', () => {
    expect(
      buildSeoHead({
        description: 'Safe description',
        structuredData: [{ description: '</script><script>alert(1)</script>' }],
        title: 'Safe title',
      }).scripts[0]?.children,
    ).toBe(
      '{"description":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}',
    )
  })

  it('renders alternate locale links alongside the canonical link', () => {
    expect(
      buildSeoHead({
        alternateLinks: [
          {
            href: 'https://shop.example.com/fr/fr/products',
            hreflang: 'fr-FR',
          },
        ],
        canonicalUrl: 'https://shop.example.com/us/en/products',
        description: 'Browse products',
        title: 'Products',
      }).links,
    ).toEqual([
      {
        href: 'https://shop.example.com/us/en/products',
        rel: 'canonical',
      },
      {
        href: 'https://shop.example.com/fr/fr/products',
        hrefLang: 'fr-FR',
        rel: 'alternate',
      },
    ])
  })

  it('rejects unsafe or invalid storefront URLs', () => {
    expect(buildCanonicalUrl('/us/en', 'javascript:alert(1)')).toBeNull()
    expect(buildCanonicalUrl('/us/en', 'https://user:pass@example.com')).toBe(
      null,
    )
    expect(buildSeoImageUrl('data:text/html,unsafe')).toBeNull()
  })
})
