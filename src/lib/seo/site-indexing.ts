import { buildCanonicalUrl, buildSeoImageUrl } from './site-seo'

export const MAX_SITEMAP_URLS = 50_000

export const ROBOTS_DISALLOW_PATHS = [
  '/api/',
  '/_',
  '/account',
  '/cart',
  '/checkout',
  '/*/*/account',
  '/*/*/cart',
  '/*/*/checkout',
  '/*/*/confirm-payment/',
  '/*/*/newsletter/verify',
  '/*/*/order-placed/',
  '/*?*availability=*',
  '/*?*limit=*',
  '/*?*option=*',
  '/*?*price_max=*',
  '/*?*price_min=*',
  '/*?*q=*',
  '/*?*sort=*',
] as const

export type SitemapCatalog = {
  categories: Array<{ permalink: string }>
  country: string
  locale: string
  products: Array<{
    imageUrl: string | null
    slug: string
  }>
}

export type SitemapEntry = {
  changeFrequency: 'daily' | 'weekly'
  imageUrl?: string
  loc: string
  priority: string
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value.trim())
}

function encodePermalink(permalink: string) {
  return permalink.split('/').map(encodePathSegment).filter(Boolean).join('/')
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function buildSitemapEntries(
  catalogs: readonly SitemapCatalog[],
  storefrontUrl: string,
) {
  const entries: SitemapEntry[] = []
  const seenUrls = new Set<string>()

  function append(entry: SitemapEntry | null) {
    if (!entry || seenUrls.has(entry.loc)) {
      return
    }

    seenUrls.add(entry.loc)
    entries.push(entry)
  }

  for (const catalog of catalogs) {
    const marketPath = `/${encodePathSegment(catalog.country)}/${encodePathSegment(catalog.locale)}`

    append(
      toSitemapEntry({
        changeFrequency: 'daily',
        path: marketPath,
        priority: '1.0',
        storefrontUrl,
      }),
    )
    append(
      toSitemapEntry({
        changeFrequency: 'daily',
        path: `${marketPath}/products`,
        priority: '0.8',
        storefrontUrl,
      }),
    )

    for (const product of catalog.products) {
      const entry = toSitemapEntry({
        changeFrequency: 'weekly',
        path: `${marketPath}/products/${encodePathSegment(product.slug)}`,
        priority: '0.7',
        storefrontUrl,
      })
      const imageUrl = buildSeoImageUrl(product.imageUrl, storefrontUrl)

      append(
        entry
          ? {
              ...entry,
              ...(imageUrl ? { imageUrl } : {}),
            }
          : null,
      )
    }

    for (const category of catalog.categories) {
      const permalink = encodePermalink(category.permalink)

      if (!permalink) {
        continue
      }

      append(
        toSitemapEntry({
          changeFrequency: 'weekly',
          path: `${marketPath}/collections/${permalink}`,
          priority: '0.6',
          storefrontUrl,
        }),
      )
    }
  }

  return entries
}

export function chunkSitemapEntries(
  entries: readonly SitemapEntry[],
  chunkSize = MAX_SITEMAP_URLS,
) {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
    throw new Error('Sitemap chunk size must be a positive safe integer')
  }

  const chunks: SitemapEntry[][] = []

  for (let index = 0; index < entries.length; index += chunkSize) {
    chunks.push(entries.slice(index, index + chunkSize))
  }

  return chunks
}

function toSitemapEntry({
  changeFrequency,
  path,
  priority,
  storefrontUrl,
}: {
  changeFrequency: SitemapEntry['changeFrequency']
  path: string
  priority: string
  storefrontUrl: string
}): SitemapEntry | null {
  const loc = buildCanonicalUrl(path, storefrontUrl)

  return loc ? { changeFrequency, loc, priority } : null
}

export function renderSitemapXml(entries: readonly SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority}</priority>${
          entry.imageUrl
            ? `\n    <image:image><image:loc>${escapeXml(entry.imageUrl)}</image:loc></image:image>`
            : ''
        }\n  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls ? `\n${urls}\n` : ''}</urlset>\n`
}

export function renderSitemapIndex(sitemapUrls: readonly string[]) {
  const sitemaps = sitemapUrls
    .map((url) => `  <sitemap>\n    <loc>${escapeXml(url)}</loc>\n  </sitemap>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps ? `\n${sitemaps}\n` : ''}</sitemapindex>\n`
}

export function renderRobotsTxt(sitemapUrl: string | null) {
  return [
    'User-agent: *',
    'Allow: /',
    ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    ...(sitemapUrl ? ['', `Sitemap: ${sitemapUrl}`] : []),
    '',
  ].join('\n')
}
