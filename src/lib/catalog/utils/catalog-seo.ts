import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  DEFAULT_PRODUCT_LISTING_SORT,
} from '@/lib/catalog/model/product-listing'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'
import type { Product } from '@/lib/catalog/model/product'
import { isCatalogItemPurchasable } from '@/lib/catalog/utils/variant-selection'
import { buildCanonicalUrl, buildSeoImageUrl } from '@/lib/seo/site-seo'

type CatalogBreadcrumb = {
  name: string
  permalink: string
}

export function buildListingCanonicalPath(
  basePath: string,
  search: ProductListingSearch,
) {
  return search.page > 1 ? `${basePath}?page=${search.page}` : basePath
}

export function shouldNoIndexProductListing(search: ProductListingSearch) {
  return Boolean(
    search.q ||
    search.option.length > 0 ||
    search.availability ||
    search.price_min !== undefined ||
    search.price_max !== undefined ||
    search.limit !== DEFAULT_PRODUCT_LISTING_SEARCH.limit ||
    search.sort !== DEFAULT_PRODUCT_LISTING_SORT,
  )
}

export function buildCatalogBreadcrumbStructuredData({
  breadcrumbs,
  canonicalUrl,
  country,
  currentItem,
  homeLabel,
  locale,
  storefrontUrl,
}: {
  breadcrumbs: readonly CatalogBreadcrumb[]
  canonicalUrl: string
  country: string
  currentItem?: { name: string }
  homeLabel: string
  locale: string
  storefrontUrl?: string
}) {
  const marketPath = `/${country}/${locale}`
  const homeUrl = buildCanonicalUrl(marketPath, storefrontUrl)
  const breadcrumbItems = breadcrumbs.flatMap((breadcrumb) => {
    const url = buildCanonicalUrl(
      `${marketPath}/collections/${breadcrumb.permalink}`,
      storefrontUrl,
    )

    return url ? [{ name: breadcrumb.name, url }] : []
  })
  const items = [
    ...(homeUrl ? [{ name: homeLabel, url: homeUrl }] : []),
    ...breadcrumbItems,
    ...(currentItem ? [{ name: currentItem.name, url: canonicalUrl }] : []),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      item: item.url,
      name: item.name,
      position: index + 1,
    })),
  }
}

export function buildProductStructuredData({
  canonicalUrl,
  product,
  storefrontUrl,
}: {
  canonicalUrl: string
  product: Product
  storefrontUrl?: string
}) {
  const description = product.metaDescription || product.description
  const imageUrls = [
    ...new Set(
      product.images.flatMap((image) => {
        const imageUrl = buildSeoImageUrl(image.src, storefrontUrl)

        return imageUrl ? [imageUrl] : []
      }),
    ),
  ]
  const defaultVariant =
    product.variants.find(
      (variant) => variant.id === product.defaultVariantId,
    ) ?? product.variants.at(0)
  const offerPrice = defaultVariant?.price ?? product.price
  const offerPreorder = defaultVariant?.preorder ?? product.preorder
  const offerInStock = defaultVariant?.inStock ?? product.inStock
  const offerPurchasable = defaultVariant
    ? isCatalogItemPurchasable(defaultVariant)
    : isCatalogItemPurchasable(product)

  const availability = offerPreorder
    ? 'https://schema.org/PreOrder'
    : offerInStock
      ? 'https://schema.org/InStock'
      : offerPurchasable
        ? 'https://schema.org/BackOrder'
        : 'https://schema.org/OutOfStock'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    ...(product.categoryBreadcrumbs.at(-1)?.name
      ? { category: product.categoryBreadcrumbs.at(-1)?.name }
      : {}),
    ...(description ? { description } : {}),
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
    name: product.name,
    offers: {
      '@type': 'Offer',
      availability,
      ...(offerPrice
        ? {
            price: offerPrice.amount,
            priceCurrency: offerPrice.currencyCode,
          }
        : {}),
      url: canonicalUrl,
    },
    ...(defaultVariant?.sku ? { sku: defaultVariant.sku } : {}),
    url: canonicalUrl,
  }
}
