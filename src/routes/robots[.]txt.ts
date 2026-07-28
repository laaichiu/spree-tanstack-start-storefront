import { createFileRoute } from '@tanstack/react-router'

import { renderRobotsTxt } from '@/lib/seo/site-indexing'
import { buildCanonicalUrl } from '@/lib/seo/site-seo'

const ROBOTS_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

function resolvePublicUrl(path: string, requestUrl: string) {
  return (
    buildCanonicalUrl(path) ??
    buildCanonicalUrl(path, new URL(requestUrl).origin)
  )
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(
          renderRobotsTxt(resolvePublicUrl('/sitemap.xml', request.url)),
          {
            headers: {
              'Cache-Control': ROBOTS_CACHE_CONTROL,
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Content-Type-Options': 'nosniff',
            },
          },
        ),
    },
  },
})
