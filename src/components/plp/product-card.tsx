import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductSummary } from '@/lib/catalog/model/product'

import { ProductPrice } from '@/components/shared/product-price'

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
          {product.image ? (
            <img
              alt={product.image.alt}
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={product.image.src}
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
              price={product.price}
              variant={isListing ? 'listing' : 'default'}
            />
          </div>
          {!product.inStock || product.preorder ? (
            <p
              className={
                isListing
                  ? 'text-sm tracking-wider text-muted-foreground uppercase'
                  : 'text-sm leading-4 font-normal uppercase mt-2 text-muted-foreground'
              }
            >
              {product.preorder
                ? t('product.preorder')
                : t('product.outOfStock')}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
