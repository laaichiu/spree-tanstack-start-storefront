import { createFileRoute } from '@tanstack/react-router'

import { BrandDirectoryPage } from '@/components/brand/brand-directory-page'
import {
  getBrands,
  loadBrandsForMarketOnServer,
} from '@/lib/brands/api/get-brands'
import type { BrandDirectoryPageModel } from '@/lib/brands/contracts'
import { parseBrandDirectorySearch } from '@/lib/brands/contracts/brand-directory-search'
import { reportError } from '@/lib/observability/report-error'
import { useMarket } from '@/components/layout/market-provider'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildStorefrontSeoHead,
  siteSeo,
  buildSeoImageUrl,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/brands/')({
  validateSearch: parseBrandDirectorySearch,
  loader: async ({ context, params }): Promise<BrandDirectoryPageModel> => {
    try {
      const brands =
        import.meta.env.SSR && context.shellResolution
          ? await loadBrandsForMarketOnServer({
              market: context.shellResolution.market,
            })
          : await getBrands({
              data: {
                market: {
                  country: params.country,
                  locale: params.locale,
                },
              },
            })

      return { brands, status: 'ready' }
    } catch (error) {
      reportError({
        context: 'brands.directory',
        error,
      })

      return { status: 'error' }
    }
  },
  head: ({ loaderData, matches, params }) => {
    const canonicalPath = `/${params.country}/${params.locale}/brands`
    const canonicalUrl = buildCanonicalUrl(canonicalPath)
    const title = getMessageFromMatches(matches, 'brand.directory')
    const description = getMessageFromMatches(
      matches,
      'brand.directoryDescription',
    )
    const imageUrl = buildSeoImageUrl(siteSeo.socialImagePath)

    return buildStorefrontSeoHead({
      alternateLinks: buildAlternateLocaleLinks({
        marketOptions: getStorefrontMarketOptionsFromMatches(matches),
        path: canonicalPath,
      }),
      canonicalUrl,
      description,
      fallbackDescription: description,
      image: imageUrl ? { alt: title, url: imageUrl } : null,
      locale: params.locale,
      matches,
      noIndex: loaderData?.status !== 'ready' || loaderData.brands.length === 0,
      title,
    })
  },
  component: BrandsDirectory,
})

function BrandsDirectory() {
  const page = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { market, t } = useMarket()

  return (
    <BrandDirectoryPage
      marketParams={{ country: market.country, locale: market.locale }}
      page={page}
      search={search}
      onSearchChange={(nextSearch, { replace = false } = {}) => {
        void navigate({
          replace,
          resetScroll: false,
          search: nextSearch,
        })
      }}
      t={t}
    />
  )
}
