import {
  createFileRoute,
  notFound,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'

import { getCollectionListing } from '@/lib/catalog/api/get-collection-listing'
import { ProductListingPage } from '@/components/plp/product-listing-page'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'
import { toProductListingApiInput } from '@/lib/catalog/api/product-listing-params'
import { parseProductListingSearch } from '@/lib/catalog/utils/product-listing-search'
import { isCatalogResourceNotFoundError } from '@/lib/catalog/utils/catalog-errors'
import { createCollectionListingPage } from '@/lib/catalog/utils/product-listing-page'
import { reportError } from '@/lib/observability/report-error'
import {
  buildCatalogBreadcrumbStructuredData,
  buildListingCanonicalPath,
  shouldNoIndexProductListing,
} from '@/lib/catalog/utils/catalog-seo'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import { translateMessage } from '@/lib/i18n/messages'
import {
  buildCanonicalUrl,
  buildSeoHead,
  buildSeoImageUrl,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/collections/$')({
  validateSearch: (search: Record<string, unknown>) =>
    parseProductListingSearch(search),
  search: {
    middlewares: [stripSearchParams(DEFAULT_PRODUCT_LISTING_SEARCH)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, params }) => {
    try {
      const listing = await getCollectionListing({
        data: {
          ...toProductListingApiInput(deps),
          market: {
            country: params.country,
            locale: params.locale,
          },
          slug: params._splat,
        },
      })

      return {
        page: createCollectionListingPage({
          listing,
          locale: params.locale,
          search: deps,
        }),
      }
    } catch (error) {
      if (isCatalogResourceNotFoundError(error)) {
        throw notFound()
      }

      reportError({
        context: 'collections.listing',
        error,
      })

      return {
        page: createCollectionListingPage({
          listing: null,
          locale: params.locale,
          search: deps,
        }),
      }
    }
  },
  head: ({ loaderData, matches, params }) => {
    const page = loaderData?.page
    const category = page?.category
    const search = page?.search ?? DEFAULT_PRODUCT_LISTING_SEARCH
    const title =
      category?.metaTitle ||
      category?.name ||
      translateMessage(params.locale, 'collection.collectionUnavailable')
    const description = category
      ? category.metaDescription ||
        category.description ||
        translateMessage(params.locale, 'collection.collectionDescription')
      : translateMessage(
          params.locale,
          'collection.collectionUnavailableDescription',
        )
    const canonicalPath = category
      ? buildListingCanonicalPath(
          `/${params.country}/${params.locale}/collections/${category.permalink}`,
          search,
        )
      : null
    const canonicalUrl = canonicalPath ? buildCanonicalUrl(canonicalPath) : null
    const primaryProductImage = page?.products[0]?.image
    const imageUrl = buildSeoImageUrl(
      category?.imageUrl || primaryProductImage?.src || siteSeo.socialImagePath,
    )
    const structuredData =
      canonicalUrl && category
        ? [
            buildCatalogBreadcrumbStructuredData({
              breadcrumbs: category.breadcrumbs,
              canonicalUrl,
              country: params.country,
              homeLabel: translateMessage(
                params.locale,
                'product.breadcrumbHome',
              ),
              locale: params.locale,
            }),
          ]
        : []
    const isFacetedListing = shouldNoIndexProductListing(search)

    return buildSeoHead({
      alternateLinks:
        canonicalPath && page?.status !== 'error' && !isFacetedListing
          ? buildAlternateLocaleLinks({
              marketOptions: getStorefrontMarketOptionsFromMatches(matches),
              path: canonicalPath,
            })
          : [],
      canonicalUrl,
      description,
      image: imageUrl
        ? {
            alt: category?.name ?? primaryProductImage?.alt ?? title,
            url: imageUrl,
          }
        : null,
      noIndex: page?.status === 'error' || !category,
      robots:
        page?.status !== 'error' && category && isFacetedListing
          ? 'noindex, follow'
          : undefined,
      structuredData,
      title,
    })
  },
  component: CollectionPage,
})

function CollectionPage() {
  const { page } = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })

  function handleApply(nextSearch: ProductListingSearch) {
    void navigate({
      search: nextSearch,
    })
  }

  return <ProductListingPage onApply={handleApply} page={page} />
}
