import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { ProductOfferBadges } from '@/components/shared/product-offer-badges'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { isCatalogItemPurchasable } from '@/lib/catalog/utils/variant-selection'

import { ProductPrice } from '@/components/shared/product-price'

import {
  getProductColorVariants,
  ProductCardVariantSwatches,
} from './product-card-variant-swatches'

type ProductCardProps = {
  product: ProductSummary
  variant?: 'default' | 'listing'
}

export function ProductCard({
  product,
  variant = 'default',
}: ProductCardProps) {
  const { market, t } = useMarket()
  const isListing = variant === 'listing'
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  )
  const displayVariant = product.variants.at(0) ?? null
  const colorVariants = useMemo(
    () => getProductColorVariants(product.variants, displayVariant?.id ?? null),
    [displayVariant?.id, product.variants],
  )
  const activeVariant =
    product.variants.find((candidate) => candidate.id === selectedVariantId) ??
    displayVariant
  const displayPrice = activeVariant?.price ?? product.price
  const displayCompareAtPrice = activeVariant
    ? activeVariant.compareAtPrice
    : product.compareAtPrice
  const displayImage = activeVariant?.image ?? product.image
  const displayPurchasable = activeVariant
    ? isCatalogItemPurchasable(activeVariant)
    : isCatalogItemPurchasable(product)
  const displayPreorder = activeVariant?.preorder ?? product.preorder

  return (
    <article className="group min-w-0">
      <Link
        aria-label={`View ${product.name}`}
        className="block text-foreground focus-visible:focus-ring"
        params={{
          country: market.country,
          locale: market.locale,
          slug: product.slug,
        }}
        to="/$country/$locale/products/$slug"
      >
        <div className="relative aspect-product w-full overflow-hidden bg-muted">
          <ProductOfferBadges
            className="absolute top-2 left-2 z-10"
            compareAtPrice={displayCompareAtPrice}
            isPreorder={displayPreorder}
            price={displayPrice}
            t={t}
          />
          {displayImage ? (
            <img
              alt={displayImage.alt}
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={displayImage.src}
            />
          ) : (
            <div className="text-sm leading-6 flex h-full items-center justify-center px-6 text-center text-muted-foreground">
              {t('product.imageComingSoon')}
            </div>
          )}
        </div>
        <div
          className={
            isListing ? 'space-y-2 px-1 pt-3' : 'bg-background px-4 py-2'
          }
        >
          <h3
            className={
              isListing
                ? 'line-clamp-2 text-sm leading-4 font-normal tracking-wider text-foreground uppercase'
                : 'line-clamp-2 text-sm leading-4 font-normal tracking-wider text-foreground uppercase'
            }
          >
            {product.name}
          </h3>
          <div className={isListing ? '' : 'mt-2'}>
            <ProductPrice
              compareAtPrice={displayCompareAtPrice}
              price={displayPrice}
              variant={isListing ? 'listing' : 'default'}
            />
          </div>
          {!displayPurchasable && !displayPreorder ? (
            <p
              className={
                isListing
                  ? 'text-sm tracking-wider text-muted-foreground uppercase'
                  : 'text-sm leading-4 font-normal uppercase mt-2 text-muted-foreground'
              }
            >
              {t('product.outOfStock')}
            </p>
          ) : null}
        </div>
      </Link>
      {isListing && product.variantsLoaded !== false ? (
        <ProductCardVariantSwatches
          activeVariantId={activeVariant?.id ?? null}
          colorVariants={colorVariants}
          onVariantChange={setSelectedVariantId}
        />
      ) : null}
    </article>
  )
}
