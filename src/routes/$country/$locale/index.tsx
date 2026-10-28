import { createFileRoute } from '@tanstack/react-router'

import {
  getHomePage,
  loadHomePageForMarketOnServer,
} from '@/lib/catalog/api/get-home-page'
import { useMarket } from '@/components/layout/market-provider'
import { HomePageView } from '@/components/home/home-page-view'
import { translateMessage } from '@/lib/i18n/messages'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildStorefrontSeoHead,
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

    return buildStorefrontSeoHead({
      alternateLinks: buildAlternateLocaleLinks({
        marketOptions: getStorefrontMarketOptionsFromMatches(matches),
        path: canonicalPath,
      }),
      canonicalUrl,
      description: translateMessage(params.locale, 'home.heroDescription'),
      fallbackDescription: translateMessage(
        params.locale,
        'home.heroDescription',
      ),
      image: imageUrl ? { alt: imageAlt, url: imageUrl } : null,
      locale: params.locale,
      matches,
      preferStoreSeo: true,
      title: translateMessage(params.locale, 'home.seoTitle'),
    })
  },
  component: Home,
})

function Home() {
  const page = Route.useLoaderData()
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  return (
    <HomePageView
      labels={{
        categories: {
          emptyDescription: t('home.noFeaturedCategoriesDescription'),
          emptyTitle: t('home.noFeaturedCategories'),
          errorDescription: t('home.featuredCategoriesLoadFailedDescription'),
          errorTitle: t('home.featuredCategoriesLoadFailed'),
          shopAll: t('home.shopAll'),
          title: t('home.featuredCategories'),
        },
        featuredProducts: {
          emptyDescription: t('product.noProductsDescription'),
          emptyTitle: t('home.noNewProducts'),
          errorDescription: t('home.newProductsLoadFailedDescription'),
          errorTitle: t('home.newProductsLoadFailed'),
          nextLabel: t('product.carouselNext'),
          previousLabel: t('product.carouselPrev'),
          title: t('home.newIn'),
          viewAll: t('home.viewAll'),
        },
        hero: {
          cta: t('home.heroCta'),
          description: t('home.heroDescription'),
          eyebrow: t('home.heroEyebrow'),
          title: t('home.heroTitle'),
        },
        product: {
          discount: (percent) =>
            t('product.discount').replace('{percent}', String(percent)),
          imageFallback: t('product.imageComingSoon'),
          outOfStock: t('product.outOfStock'),
          preorder: t('product.preorder'),
        },
      }}
      marketParams={marketParams}
      page={page}
    />
  )
}
