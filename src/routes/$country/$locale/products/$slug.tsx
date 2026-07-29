import { createFileRoute, notFound } from '@tanstack/react-router'

import { ProductDetail } from '@/components/pdp/product-detail'
import { ProductDetailEmptyState } from '@/components/pdp/product-detail-empty-state'
import { getProductPage } from '@/lib/catalog/api/get-product-page'
import { isCatalogResourceNotFoundError } from '@/lib/catalog/utils/catalog-errors'
import { reportError } from '@/lib/observability/report-error'
import { translateMessage } from '@/lib/i18n/messages'
import {
  buildCatalogBreadcrumbStructuredData,
  buildProductStructuredData,
} from '@/lib/catalog/utils/catalog-seo'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildCanonicalUrl,
  buildSeoHead,
  buildSeoImageUrl,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/products/$slug')({
  loader: async ({ params }) => {
    try {
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
    const description =
      product?.metaDescription ||
      product?.description ||
      translateMessage(params.locale, 'product.productUnavailableDescription')
    const title =
      product?.metaTitle ||
      product?.name ||
      translateMessage(params.locale, 'product.products')
    const canonicalPath = product
      ? `/${params.country}/${params.locale}/products/${product.slug}`
      : null
    const canonicalUrl = canonicalPath ? buildCanonicalUrl(canonicalPath) : null
    const primaryImage = product?.images[0]
    const imageUrl = buildSeoImageUrl(
      primaryImage?.src ?? siteSeo.socialImagePath,
    )
    const structuredData =
      product && canonicalUrl
        ? [
            buildProductStructuredData({ canonicalUrl, product }),
            buildCatalogBreadcrumbStructuredData({
              breadcrumbs: product.categoryBreadcrumbs,
              canonicalUrl,
              country: params.country,
              currentItem: { name: product.name },
              homeLabel: translateMessage(
                params.locale,
                'product.breadcrumbHome',
              ),
              locale: params.locale,
            }),
          ]
        : []

    return buildSeoHead({
      alternateLinks: canonicalPath
        ? buildAlternateLocaleLinks({
            marketOptions: getStorefrontMarketOptionsFromMatches(matches),
            path: canonicalPath,
          })
        : [],
      canonicalUrl,
      description,
      image: imageUrl
        ? { alt: primaryImage?.alt ?? title, url: imageUrl }
        : null,
      noIndex: !product,
      ogType: product ? 'product' : 'website',
      structuredData,
      title,
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
