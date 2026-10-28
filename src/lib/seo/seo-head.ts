import type {
  SeoAlternateLink,
  SeoMetaEntry,
  SeoMetaInput,
  StructuredData,
} from './seo-types'

function serializeStructuredData(data: StructuredData) {
  return JSON.stringify(data).replaceAll('<', '\\u003c')
}

export function buildSeoMeta({
  canonicalUrl,
  description,
  image,
  noIndex = false,
  ogType = 'website',
  robots,
  title,
}: SeoMetaInput): SeoMetaEntry[] {
  const robotsContent = robots ?? (noIndex ? 'noindex, nofollow' : null)

  return [
    { title },
    { content: description, name: 'description' },
    { content: title, property: 'og:title' },
    { content: description, property: 'og:description' },
    { content: ogType, property: 'og:type' },
    ...(canonicalUrl ? [{ content: canonicalUrl, property: 'og:url' }] : []),
    ...(image
      ? [
          { content: image.url, property: 'og:image' },
          { content: image.alt, property: 'og:image:alt' },
        ]
      : []),
    {
      content: image ? 'summary_large_image' : 'summary',
      name: 'twitter:card',
    },
    { content: title, name: 'twitter:title' },
    { content: description, name: 'twitter:description' },
    ...(image
      ? [
          { content: image.url, name: 'twitter:image' },
          { content: image.alt, name: 'twitter:image:alt' },
        ]
      : []),
    ...(robotsContent ? [{ content: robotsContent, name: 'robots' }] : []),
  ]
}

export function buildSeoHead({
  alternateLinks = [],
  canonicalUrl,
  structuredData = [],
  ...metaInput
}: SeoMetaInput & {
  alternateLinks?: readonly SeoAlternateLink[]
  structuredData?: StructuredData[]
}) {
  return {
    links: [
      ...(canonicalUrl
        ? [
            {
              href: canonicalUrl,
              rel: 'canonical',
            },
          ]
        : []),
      ...alternateLinks.map((link) => ({
        href: link.href,
        hrefLang: link.hreflang,
        rel: 'alternate',
      })),
    ],
    meta: buildSeoMeta({
      ...metaInput,
      canonicalUrl,
    }),
    scripts: structuredData.map((data) => ({
      children: serializeStructuredData(data),
      type: 'application/ld+json',
    })),
  }
}
