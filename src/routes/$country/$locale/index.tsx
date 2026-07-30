import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/components/home/home-page'
import {
  getHomePage,
  loadHomePageForMarketOnServer,
} from '@/lib/catalog/api/get-home-page'
import { translateMessage } from '@/lib/i18n/messages'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildSeoHead,
  buildSeoImageUrl,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/')({
  loader: async ({ context, params }) => {
    if (import.meta.env.SSR && context.shellResolution) {
      return loadHomePageForMarketOnServer(context.shellResolution.market)
    }

    return getHomePage({
      data: {
        market: {
          country: params.country,
          locale: params.locale,
        },
      },
    })
  },
  head: ({ matches, params }) => {
    const canonicalPath = `/${params.country}/${params.locale}`
    const canonicalUrl = buildCanonicalUrl(canonicalPath)
    const imageUrl = buildSeoImageUrl(siteSeo.socialImagePath)
    const imageAlt = translateMessage(params.locale, 'home.heroTitle')

    return buildSeoHead({
      alternateLinks: buildAlternateLocaleLinks({
        marketOptions: getStorefrontMarketOptionsFromMatches(matches),
        path: canonicalPath,
      }),
      canonicalUrl,
      description: translateMessage(params.locale, 'home.heroDescription'),
      image: imageUrl ? { alt: imageAlt, url: imageUrl } : null,
      title: siteSeo.title,
    })
  },
  component: Home,
})

function Home() {
  const page = Route.useLoaderData()

  return <HomePage page={page} />
}
