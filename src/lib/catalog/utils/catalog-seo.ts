import { isCatalogItemPurchasable } from '@/lib/catalog/contracts'
import type { Product } from '@/lib/catalog/contracts'
import { buildCanonicalUrl, buildSeoImageUrl } from '@/lib/seo/site-seo'

export {
  buildListingCanonicalPath,
  shouldNoIndexProductListing,
} from '@/lib/catalog/contracts'

type CatalogBreadcrumb = {
  name: string
  permalink: string
}

export function buildCatalogBreadcrumbLinks({
  breadcrumbs,
  country,
  homeLabel,
  locale,
  storefrontUrl,
}: {
  breadcrumbs: readonly CatalogBreadcrumb[]
  country: string
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
  return {
    breadcrumbs: breadcrumbItems,
    home: homeUrl ? { name: homeLabel, url: homeUrl } : null,
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
  const declaredDefaultVariant = product.variants.find(
    (variant) => variant.id === product.defaultVariantId,
  )
  const offerVariant =
    declaredDefaultVariant ??
    (product.defaultVariantId === null ? product.variants.at(0) : undefined)
  const offerPrice = offerVariant ? offerVariant.price : product.price
  const offerPreorder = offerVariant?.preorder ?? product.preorder
  const offerInStock = offerVariant?.inStock ?? product.inStock
  const offerPurchasable = offerVariant
    ? isCatalogItemPurchasable(offerVariant)
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
    ...(offerVariant?.sku ? { sku: offerVariant.sku } : {}),
    url: canonicalUrl,
  }
}
