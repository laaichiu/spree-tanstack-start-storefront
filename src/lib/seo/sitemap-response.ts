import type { SitemapCatalog } from './site-indexing'
import {
  buildSitemapEntries,
  chunkSitemapEntries,
  renderSitemapIndex,
  renderSitemapXml,
} from './site-indexing'
import { buildCanonicalUrl } from './site-seo'

export const SITEMAP_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

export type SitemapPart =
  | { kind: 'index' }
  | { kind: 'invalid' }
  | { kind: 'shard'; number: number }

export function parseSitemapPart(requestUrl: string): SitemapPart {
  let value: string | null

  try {
    value = new URL(requestUrl).searchParams.get('part')
  } catch {
    return { kind: 'invalid' }
  }

  if (value === null) {
    return { kind: 'index' }
  }

  if (!/^\d+$/.test(value)) {
    return { kind: 'invalid' }
  }

  const number = Number(value)

  return Number.isSafeInteger(number) && number > 0
    ? { kind: 'shard', number }
    : { kind: 'invalid' }
}

export function resolveSitemapPublicUrl(
  requestUrl: string,
  path = '/',
  configuredUrl: string | null | undefined = buildCanonicalUrl(path),
) {
  try {
    return configuredUrl ?? buildCanonicalUrl(path, new URL(requestUrl).origin)
  } catch {
    return null
  }
}

export function sitemapXmlResponse(
  body: string,
  status = 200,
  cacheControl = SITEMAP_CACHE_CONTROL,
) {
  return new Response(body, {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    status,
  })
}

export function sitemapNotFoundResponse() {
  return new Response('Not found', {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    status: 404,
  })
}

export function unavailableSitemapResponse() {
  const response = sitemapXmlResponse(renderSitemapXml([]), 503, 'no-store')
  response.headers.set('Retry-After', '300')
  return response
}

export function renderSitemapResponse({
  catalogs,
  part,
  storefrontUrl,
}: {
  catalogs: readonly SitemapCatalog[]
  part: SitemapPart
  storefrontUrl: string
}) {
  if (part.kind === 'invalid') {
    return sitemapNotFoundResponse()
  }

  const entries = buildSitemapEntries(catalogs, storefrontUrl)
  const chunks = chunkSitemapEntries(entries)

  if (part.kind === 'shard') {
    if (part.number < 1 || part.number > chunks.length) {
      return sitemapNotFoundResponse()
    }

    return sitemapXmlResponse(renderSitemapXml(chunks[part.number - 1] ?? []))
  }

  if (chunks.length <= 1) {
    return sitemapXmlResponse(renderSitemapXml(chunks[0] ?? []))
  }

  const sitemapUrls = chunks
    .map((_, index) =>
      buildCanonicalUrl(`/sitemap.xml?part=${index + 1}`, storefrontUrl),
    )
    .filter((url): url is string => Boolean(url))

  return sitemapUrls.length === chunks.length
    ? sitemapXmlResponse(renderSitemapIndex(sitemapUrls))
    : unavailableSitemapResponse()
}
