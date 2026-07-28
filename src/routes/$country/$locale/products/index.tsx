import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'

import { getProductsPageSummaries } from '@/lib/catalog/api/get-products-page-summaries'
import { ProductListingPage } from '@/components/plp/product-listing-page'
import { reportError } from '@/lib/observability/report-error'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'
import { toProductListingApiInput } from '@/lib/catalog/api/product-listing-params'
import { createProductsListingPage } from '@/lib/catalog/utils/product-listing-page'
import { parseProductListingSearch } from '@/lib/catalog/utils/product-listing-search'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import {
  buildListingCanonicalPath,
  shouldNoIndexProductListing,
} from '@/lib/catalog/utils/catalog-seo'
import { translateMessage } from '@/lib/i18n/messages'
import {
  buildCanonicalUrl,
  buildSeoHead,
  buildSeoImageUrl,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/products/')({
  validateSearch: (search: Record<string, unknown>) =>
    parseProductListingSearch(search),
  search: {
    middlewares: [stripSearchParams(DEFAULT_PRODUCT_LISTING_SEARCH)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, params }) => {
    try {
      const listing = await getProductsPageSummaries({
        data: {
          ...toProductListingApiInput(deps),
          market: {
            country: params.country,
            locale: params.locale,
          },
        },
      })

      return {
        page: createProductsListingPage({
          listing,
          locale: params.locale,
          search: deps,
        }),
      }
    } catch (error) {
      reportError({
        context: 'products.listing',
        error,
      })

      return {
        page: createProductsListingPage({
          listing: null,
          locale: params.locale,
          search: deps,
        }),
      }
    }
  },
  head: ({ loaderData, matches, params }) => {
    const page = loaderData?.page
    const search = page?.search ?? DEFAULT_PRODUCT_LISTING_SEARCH
    const title =
      page?.title ?? translateMessage(params.locale, 'product.products')
    const canonicalPath = buildListingCanonicalPath(
      `/${params.country}/${params.locale}/products`,
      search,
    )
    const canonicalUrl = buildCanonicalUrl(canonicalPath)
    const primaryImage = page?.products[0]?.image
    const imageUrl = buildSeoImageUrl(
      primaryImage?.src ?? siteSeo.socialImagePath,
    )
    const isFacetedListing = shouldNoIndexProductListing(search)

    return buildSeoHead({
      alternateLinks:
        page?.status !== 'error' && !isFacetedListing
          ? buildAlternateLocaleLinks({
              marketOptions: getStorefrontMarketOptionsFromMatches(matches),
              path: canonicalPath,
            })
          : [],
      canonicalUrl,
      description: translateMessage(
        params.locale,
        'product.productsDescription',
      ),
      image: imageUrl
        ? { alt: primaryImage?.alt ?? title, url: imageUrl }
        : null,
      noIndex: page?.status === 'error',
      robots:
        page?.status !== 'error' && isFacetedListing
          ? 'noindex, follow'
          : undefined,
      title,
    })
  },
  component: ProductsPage,
})

function ProductsPage() {
  const { page } = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })

  function handleApply(nextSearch: ProductListingSearch) {
    void navigate({
      search: nextSearch,
    })
  }

  return <ProductListingPage onApply={handleApply} page={page} />
}
