import {
  createFileRoute,
  notFound,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'

import {
  getCollectionListing,
  loadCollectionListingForMarketOnServer,
} from '@/lib/catalog/api/get-collection-listing'
import { ProductListingPage } from '@/components/plp/product-listing-page'
import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  buildListingCanonicalPath,
  getCatalogBreadcrumbStructuredData,
  getCatalogSeoText,
  parseProductListingSearch,
  shouldNoIndexProductListing,
} from '@/lib/catalog/contracts'
import type { ProductListingSearch } from '@/lib/catalog/contracts'
import { toProductListingApiInput } from '@/lib/catalog/api/product-listing-params'
import { isCatalogResourceNotFoundError } from '@/lib/catalog/utils/catalog-errors'
import { createCollectionListingPage } from '@/lib/catalog/utils/product-listing-page'
import { reportError } from '@/lib/observability/report-error'
import { buildCatalogBreadcrumbLinks } from '@/lib/catalog/utils/catalog-seo'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import { translateMessage } from '@/lib/i18n/messages'
import {
  buildCanonicalUrl,
  buildSeoImageUrl,
  buildStorefrontSeoHead,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/collections/$')({
  validateSearch: parseProductListingSearch,
  search: {
    middlewares: [stripSearchParams(DEFAULT_PRODUCT_LISTING_SEARCH)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    try {
      const slug = params._splat ?? ''
      const listingInput = {
        ...toProductListingApiInput(deps),
        market: {
          country: params.country,
          locale: params.locale,
        },
        slug,
      }
      if (import.meta.env.SSR && context.shellResolution && slug) {
        const listing = await loadCollectionListingForMarketOnServer({
          ...listingInput,
          market: context.shellResolution.market,
        })

        return {
          page: createCollectionListingPage({
            listing,
            locale: params.locale,
            search: deps,
          }),
        }
      }

      const listing = await getCollectionListing({
        data: listingInput,
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
    const { description, title } = getCatalogSeoText({
      description: category?.description,
      fallbackDescription: category
        ? translateMessage(params.locale, 'collection.collectionDescription')
        : translateMessage(
            params.locale,
            'collection.collectionUnavailableDescription',
          ),
      fallbackTitle: translateMessage(
        params.locale,
        'collection.collectionUnavailable',
      ),
      metaDescription: category?.metaDescription,
      metaTitle: category?.metaTitle,
      name: category?.name,
    })
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
    const breadcrumbLinks =
      category && canonicalUrl
        ? buildCatalogBreadcrumbLinks({
            breadcrumbs: category.breadcrumbs,
            country: params.country,
            homeLabel: translateMessage(
              params.locale,
              'product.breadcrumbHome',
            ),
            locale: params.locale,
          })
        : null
    const structuredData = breadcrumbLinks
      ? [
          getCatalogBreadcrumbStructuredData({
            breadcrumbs: breadcrumbLinks.breadcrumbs,
            home: breadcrumbLinks.home,
          }),
        ]
      : []
    const isFacetedListing = shouldNoIndexProductListing(search)

    return buildStorefrontSeoHead({
      alternateLinks:
        canonicalPath && page?.status !== 'error' && !isFacetedListing
          ? buildAlternateLocaleLinks({
              marketOptions: getStorefrontMarketOptionsFromMatches(matches),
              path: canonicalPath,
            })
          : [],
      canonicalUrl,
      description,
      fallbackDescription: translateMessage(
        params.locale,
        'collection.collectionUnavailableDescription',
      ),
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
      locale: params.locale,
      matches,
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
