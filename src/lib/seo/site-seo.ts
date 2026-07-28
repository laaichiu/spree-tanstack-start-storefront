import { readPublicBuildEnv } from '@/lib/env/public'

export const siteSeo = {
  title: 'Spree Storefront',
  description:
    'A carefully built Spree headless storefront for considered commerce.',
  socialImagePath: '/hero-1600.webp',
}

type SeoMetaEntry =
  | { title: string }
  | { content: string; name: string }
  | { content: string; property: string }

type SeoImage = {
  alt: string
  url: string
}

type SeoRobotsDirective = 'noindex, follow' | 'noindex, nofollow'

type SeoMetaInput = {
  canonicalUrl?: string | null
  description: string
  image?: SeoImage | null
  noIndex?: boolean
  ogType?: 'product' | 'website'
  robots?: SeoRobotsDirective
  title: string
}

type StructuredData = Record<string, unknown>

export type SeoAlternateLink = {
  href: string
  hreflang: string
}

function serializeStructuredData(data: StructuredData) {
  return JSON.stringify(data).replaceAll('<', '\\u003c')
}

function getConfiguredStorefrontUrl() {
  return readPublicBuildEnv({
    VITE_STOREFRONT_URL: import.meta.env.VITE_STOREFRONT_URL,
  }).storefrontUrl
}

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value)

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null
    }

    return url
  } catch {
    return null
  }
}

function normalizeStorefrontUrl(value: string) {
  const url = parseHttpUrl(value)

  if (!url) {
    return null
  }

  try {
    url.hash = ''
    url.search = ''

    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

export function buildCanonicalUrl(
  path: string,
  storefrontUrl = getConfiguredStorefrontUrl(),
) {
  const baseUrl = storefrontUrl ? normalizeStorefrontUrl(storefrontUrl) : null

  if (!baseUrl) {
    return null
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  try {
    const url = new URL(`${baseUrl}${normalizedPath}`)

    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function buildSeoImageUrl(
  source: string | null | undefined,
  storefrontUrl = getConfiguredStorefrontUrl(),
) {
  const trimmedSource = source?.trim()

  if (!trimmedSource) {
    return null
  }

  try {
    const absoluteSource = new URL(trimmedSource)

    return parseHttpUrl(absoluteSource.toString())?.toString() ?? null
  } catch {
    return buildCanonicalUrl(trimmedSource, storefrontUrl)
  }
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
