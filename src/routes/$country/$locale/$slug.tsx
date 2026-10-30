import {
  createFileRoute,
  notFound,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'

import { EmptyStateView } from '@/components/shared/empty-state-view'
import { BrandProfilePage } from '@/components/brand/brand-profile-page'
import {
  getBrand,
  getBrandProducts,
  loadBrandForMarketOnServer,
  loadBrandProductsForMarketOnServer,
} from '@/lib/brands/api/get-brands'
import { DEFAULT_BRAND_SEARCH, parseBrandSearch } from '@/lib/brands/contracts'
import type { BrandProfile } from '@/lib/brands/contracts'
import { createBrandProductListingPage } from '@/lib/brands/utils/brand-product-listing-page'
import type { ProductListingSearch } from '@/lib/catalog/contracts'
import { isReservedMarketRouteSegment } from '@/config/routes'
import { isCatalogResourceNotFoundError } from '@/lib/catalog/utils/catalog-errors'
import { reportError } from '@/lib/observability/report-error'
import { useMarket } from '@/components/layout/market-provider'
import { fallbackMessages, loadMessages } from '@/lib/i18n/messages'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildSeoImageUrl,
  buildStorefrontSeoHead,
  siteSeo,
} from '@/lib/seo/site-seo'

type BrandRoutePage =
  | { status: 'error' }
  | {
      brand: BrandProfile
      productsPage: ReturnType<typeof createBrandProductListingPage>
      status: 'ready'
    }

export const Route = createFileRoute('/$country/$locale/$slug')({
  validateSearch: parseBrandSearch,
  search: {
    middlewares: [stripSearchParams(DEFAULT_BRAND_SEARCH)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }): Promise<BrandRoutePage> => {
    if (isReservedMarketRouteSegment(params.slug)) {
      throw notFound()
    }

    const messagesPromise = loadMessages(params.locale).catch(
      () => fallbackMessages,
    )

    try {
      const market = {
        country: params.country,
        locale: params.locale,
      }
      const brand =
        import.meta.env.SSR && context.shellResolution
          ? await loadBrandForMarketOnServer({
              market: context.shellResolution.market,
              slug: params.slug,
            })
          : await getBrand({
              data: { market, slug: params.slug },
            })

      try {
        const productsPromise =
          import.meta.env.SSR && context.shellResolution
            ? loadBrandProductsForMarketOnServer({
                market: context.shellResolution.market,
                search: deps,
                sellerId: brand.id,
              })
            : getBrandProducts({
                data: { market, search: deps, sellerId: brand.id },
              })
        const [products, messages] = await Promise.all([
          productsPromise,
          messagesPromise,
        ])

        return {
          brand,
          productsPage: createBrandProductListingPage({
            listing: products,
            messages,
            search: deps,
          }),
          status: 'ready',
        }
      } catch (error) {
        reportError({
          context: 'brands.profile.products',
          error,
        })
        const messages = await messagesPromise

        return {
          brand,
          productsPage: createBrandProductListingPage({
            listing: null,
            messages,
            search: deps,
          }),
          status: 'ready',
        }
      }
    } catch (error) {
      if (isCatalogResourceNotFoundError(error)) {
        throw notFound()
      }

      reportError({
        context: 'brands.profile',
        error,
      })

      return {
        status: 'error',
      }
    }
  },
  head: ({ loaderData, matches, params }) => {
    const brand = loaderData?.status === 'ready' ? loaderData.brand : null
    const canonicalPath = brand
      ? `/${params.country}/${params.locale}/${brand.slug}`
      : null
    const canonicalUrl = canonicalPath ? buildCanonicalUrl(canonicalPath) : null
    const title =
      brand?.name ?? getMessageFromMatches(matches, 'brand.profileUnavailable')
    const description =
      brand?.about ||
      getMessageFromMatches(matches, 'brand.profileUnavailableDescription')
    const imageUrl = buildSeoImageUrl(
      brand?.coverPhotoUrl ?? brand?.logoUrl ?? siteSeo.socialImagePath,
    )

    return buildStorefrontSeoHead({
      alternateLinks: canonicalPath
        ? buildAlternateLocaleLinks({
            marketOptions: getStorefrontMarketOptionsFromMatches(matches),
            path: canonicalPath,
          })
        : [],
      canonicalUrl,
      description,
      fallbackDescription: getMessageFromMatches(
        matches,
        'brand.profileUnavailableDescription',
      ),
      image: imageUrl ? { alt: title, url: imageUrl } : null,
      locale: params.locale,
      matches,
      noIndex:
        loaderData?.status !== 'ready' ||
        loaderData.productsPage.search.page > 1,
      structuredData:
        brand && canonicalUrl
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'Brand',
                description: brand.about || undefined,
                image: brand.logoUrl ?? brand.squareLogoUrl ?? undefined,
                name: brand.name,
                url: canonicalUrl,
              },
            ]
          : [],
      title,
    })
  },
  component: BrandProfileRoute,
})

function BrandProfileRoute() {
  const page = Route.useLoaderData()
  const { market, t } = useMarket()
  const navigate = useNavigate({ from: Route.fullPath })
  const marketParams = { country: market.country, locale: market.locale }

  if (page.status === 'error') {
    return (
      <EmptyStateView
        model={{
          description: t('brand.profileUnavailableDescription'),
          title: t('brand.profileUnavailable'),
        }}
      />
    )
  }

  function handleApply(nextSearch: ProductListingSearch) {
    void navigate({ search: nextSearch })
  }

  return (
    <BrandProfilePage
      brand={page.brand}
      marketParams={marketParams}
      onProductsApply={handleApply}
      productsPage={page.productsPage}
      t={t}
    />
  )
}
