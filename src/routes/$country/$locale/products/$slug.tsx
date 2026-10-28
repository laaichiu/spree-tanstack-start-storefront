import { createFileRoute, notFound } from '@tanstack/react-router'

import { ProductDetail } from '@/components/pdp/product-detail'
import { ProductDetailEmptyState } from '@/components/pdp/product-detail-empty-state'
import {
  getCatalogBreadcrumbStructuredData,
  getCatalogSeoText,
} from '@/lib/catalog/contracts'
import {
  getProductPage,
  loadProductPageForMarketOnServer,
} from '@/lib/catalog/api/get-product-page'
import { isCatalogResourceNotFoundError } from '@/lib/catalog/utils/catalog-errors'
import { reportError } from '@/lib/observability/report-error'
import { translateMessage } from '@/lib/i18n/messages'
import {
  buildCatalogBreadcrumbLinks,
  buildProductStructuredData,
} from '@/lib/catalog/utils/catalog-seo'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildSeoImageUrl,
  buildStorefrontSeoHead,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/products/$slug')({
  loader: async ({ context, params }) => {
    try {
      if (import.meta.env.SSR && context.shellResolution) {
        return loadProductPageForMarketOnServer({
          market: context.shellResolution.market,
          slug: params.slug,
        })
      }

      const page = await getProductPage({
        data: {
          market: {
            country: params.country,
            locale: params.locale,
          },
          slug: params.slug,
        },
      })

      return page
    } catch (error) {
      if (isCatalogResourceNotFoundError(error)) {
        throw notFound()
      }

      reportError({
        context: 'products.detail',
        error,
      })

      return null
    }
  },
  notFoundComponent: ProductDetailEmptyState,
  head: ({ loaderData, matches, params }) => {
    const product = loaderData?.product
    const { description, title } = getCatalogSeoText({
      description: product?.description,
      fallbackDescription: translateMessage(
        params.locale,
        'product.productUnavailableDescription',
      ),
      fallbackTitle: translateMessage(params.locale, 'product.products'),
      metaDescription: product?.metaDescription,
      metaTitle: product?.metaTitle,
      name: product?.name,
    })
    const canonicalPath = product
      ? `/${params.country}/${params.locale}/products/${product.slug}`
      : null
    const canonicalUrl = canonicalPath ? buildCanonicalUrl(canonicalPath) : null
    const primaryImage = product?.images[0]
    const imageUrl = buildSeoImageUrl(
      primaryImage?.src ?? siteSeo.socialImagePath,
    )
    const breadcrumbLinks =
      product && canonicalUrl
        ? buildCatalogBreadcrumbLinks({
            breadcrumbs: product.categoryBreadcrumbs,
            country: params.country,
            homeLabel: translateMessage(
              params.locale,
              'product.breadcrumbHome',
            ),
            locale: params.locale,
          })
        : null
    const structuredData =
      product && canonicalUrl && breadcrumbLinks
        ? [
            buildProductStructuredData({ canonicalUrl, product }),
            getCatalogBreadcrumbStructuredData({
              breadcrumbs: breadcrumbLinks.breadcrumbs,
              currentItem: { name: product.name, url: canonicalUrl },
              home: breadcrumbLinks.home,
            }),
          ]
        : []

    return buildStorefrontSeoHead({
      alternateLinks: canonicalPath
        ? buildAlternateLocaleLinks({
            marketOptions: getStorefrontMarketOptionsFromMatches(matches),
            path: canonicalPath,
          })
        : [],
      canonicalUrl,
      description,
      fallbackDescription: translateMessage(
        params.locale,
        'product.productUnavailableDescription',
      ),
      image: imageUrl
        ? { alt: primaryImage?.alt ?? title, url: imageUrl }
        : null,
      noIndex: !product,
      ogType: product ? 'product' : 'website',
      structuredData,
      title,
      locale: params.locale,
      matches,
    })
  },
  component: ProductPage,
})

function ProductPage() {
  const page = Route.useLoaderData()

  return page ? (
    <ProductDetail key={page.product.id} page={page} />
  ) : (
    <ProductDetailEmptyState />
  )
}
