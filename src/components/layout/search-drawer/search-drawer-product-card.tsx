import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { formatMoney } from '@/lib/money/format-money'

export function SearchPreviewRow({
  onSelect,
  product,
}: {
  onSelect: () => void
  product: ProductSummary
}) {
  const { market, t } = useMarket()

  return (
    <Link
      className="group flex items-start gap-4 border-b border-border py-4 text-foreground transition hover:text-muted-foreground focus-visible:focus-ring last:border-b-0"
      onClick={onSelect}
      params={{
        country: market.country,
        locale: market.locale,
        slug: product.slug,
      }}
      to="/$country/$locale/products/$slug"
    >
      <div className="relative aspect-product w-20 shrink-0 overflow-hidden bg-muted">
        {product.image ? (
          <img
            alt={product.image.alt}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
            sizes="5rem"
            src={product.image.src}
          />
        ) : (
          <div className="text-sm leading-6 flex h-full w-full items-center justify-center px-2 text-center text-muted-foreground">
            {t('product.imageComingSoon')}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-sm leading-4 font-normal uppercase line-clamp-2 text-foreground">
          {product.name}
        </h3>
        <SearchProductPrice product={product} />
      </div>
    </Link>
  )
}

export function SearchFeaturedProductCard({
  onSelect,
  product,
}: {
  onSelect: () => void
  product: ProductSummary
}) {
  const { market, t } = useMarket()

  return (
    <Link
      className="group block max-w-[10rem] min-w-[10rem] shrink-0 snap-start text-foreground focus-visible:focus-ring lg:snap-none"
      draggable={false}
      onClick={onSelect}
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
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
            draggable={false}
            loading="lazy"
            sizes="10rem"
            src={product.image.src}
          />
        ) : (
          <div className="text-sm leading-6 flex h-full w-full items-center justify-center px-3 text-center text-muted-foreground">
            {t('product.imageComingSoon')}
          </div>
        )}
      </div>
      <div className="space-y-2 px-0.5 pt-3">
        <h3 className="text-sm leading-4 font-normal uppercase line-clamp-2 text-foreground">
          {product.name}
        </h3>
        <SearchProductPrice product={product} />
      </div>
    </Link>
  )
}

function SearchProductPrice({ product }: { product: ProductSummary }) {
  const { market } = useMarket()

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm leading-5 text-foreground">
      <span>{formatMoney(product.price, market.locale)}</span>
      {product.compareAtPrice ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney(product.compareAtPrice, market.locale)}
        </span>
      ) : null}
    </div>
  )
}
