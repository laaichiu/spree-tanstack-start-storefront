import { createFileRoute } from '@tanstack/react-router'

import { reportError } from '@/lib/observability/report-error'
import {
  parseSitemapPart,
  renderSitemapResponse,
  resolveSitemapPublicUrl,
  sitemapNotFoundResponse,
  unavailableSitemapResponse,
} from '@/lib/seo/sitemap-response'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const part = parseSitemapPart(request.url)

        if (part.kind === 'invalid') {
          return sitemapNotFoundResponse()
        }

        const storefrontUrl = resolveSitemapPublicUrl(request.url)

        if (!storefrontUrl) {
          return unavailableSitemapResponse()
        }

        try {
          const { getCatalogSitemapData } =
            await import('@/lib/catalog/api/get-catalog-sitemap.server')
          const catalogs = await getCatalogSitemapData()
          return renderSitemapResponse({ catalogs, part, storefrontUrl })
        } catch (error) {
          reportError({
            context: 'sitemap.generate',
            error,
          })

          return unavailableSitemapResponse()
        }
      },
    },
  },
})
