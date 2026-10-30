import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'

import {
  getProductsPageSummaries,
  loadProductsPageSummariesForMarketOnServer,
} from '@/lib/catalog/api/get-products-page-summaries'
import { ProductListingPage } from '@/components/plp/product-listing-page'
import { reportError } from '@/lib/observability/report-error'
import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  buildListingCanonicalPath,
  parseProductListingSearch,
  shouldNoIndexProductListing,
} from '@/lib/catalog/contracts'
import type { ProductListingSearch } from '@/lib/catalog/contracts'
import { toProductListingApiInput } from '@/lib/catalog/api/product-listing-params'
import { createProductsListingPage } from '@/lib/catalog/utils/product-listing-page'
import { buildAlternateLocaleLinks } from '@/lib/seo/alternate-locale'
import { getStorefrontMarketOptionsFromMatches } from '@/lib/seo/alternate-locale-loader'
import { fallbackMessages, loadMessages } from '@/lib/i18n/messages'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import {
  buildCanonicalUrl,
  buildSeoImageUrl,
  buildStorefrontSeoHead,
  siteSeo,
} from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/products/')({
  validateSearch: parseProductListingSearch,
  search: {
    middlewares: [stripSearchParams(DEFAULT_PRODUCT_LISTING_SEARCH)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    const messagesPromise = loadMessages(params.locale).catch(
      () => fallbackMessages,
    )

    try {
      const listingInput = {
        ...toProductListingApiInput(deps),
        market: {
          country: params.country,
          locale: params.locale,
        },
      }
      if (import.meta.env.SSR && context.shellResolution) {
        const [listing, messages] = await Promise.all([
          loadProductsPageSummariesForMarketOnServer({
            ...listingInput,
            market: context.shellResolution.market,
          }),
          messagesPromise,
        ])

        return {
          page: createProductsListingPage({
            listing,
            messages,
            search: deps,
          }),
        }
      }

      const [listing, messages] = await Promise.all([
        getProductsPageSummaries({ data: listingInput }),
        messagesPromise,
      ])

      return {
        page: createProductsListingPage({
          listing,
          messages,
          search: deps,
        }),
      }
    } catch (error) {
      reportError({
        context: 'products.listing',
        error,
      })
      const messages = await messagesPromise

      return {
        page: createProductsListingPage({
          listing: null,
          messages,
          search: deps,
        }),
      }
    }
  },
  head: ({ loaderData, matches, params }) => {
    const page = loaderData?.page
    const search = page?.search ?? DEFAULT_PRODUCT_LISTING_SEARCH
    const title =
      page?.title ?? getMessageFromMatches(matches, 'product.products')
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

    return buildStorefrontSeoHead({
      alternateLinks:
        page?.status !== 'error' && !isFacetedListing
          ? buildAlternateLocaleLinks({
              marketOptions: getStorefrontMarketOptionsFromMatches(matches),
              path: canonicalPath,
            })
          : [],
      canonicalUrl,
      description: getMessageFromMatches(
        matches,
        'product.productsDescription',
      ),
      fallbackDescription: getMessageFromMatches(
        matches,
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
      locale: params.locale,
      matches,
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
