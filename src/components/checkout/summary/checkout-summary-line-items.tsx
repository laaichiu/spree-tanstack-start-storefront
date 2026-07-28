import { useMarket } from '@/components/layout/market-provider'
import { ProductPrice } from '@/components/shared/product-price'
import type { CartLineItem } from '@/lib/cart/model/cart'

function CheckoutSummaryLineItem({ item }: { item: CartLineItem }) {
  const { market, t } = useMarket()
  const productHref = `/${market.country}/${market.locale}/products/${encodeURIComponent(
    item.productSlug,
  )}`

  return (
    <li className="flex items-start gap-4">
      <a
        className="relative h-[4.875rem] w-16 shrink-0 bg-muted focus-visible:focus-ring"
        href={productHref}
      >
        <span className="block h-full w-full overflow-hidden border border-border bg-muted">
          {item.imageUrl ? (
            <img
              alt={item.name}
              className="h-full w-full object-cover object-center"
              loading="lazy"
              src={item.imageUrl}
            />
          ) : (
            <span className="text-sm leading-6 flex h-full items-center justify-center px-2 text-center text-muted-foreground">
              {t('product.imageComingSoon')}
            </span>
          )}
        </span>
        <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1 text-sm leading-none font-normal text-background">
          {item.quantity}
        </span>
      </a>

      <div className="min-w-0 flex-1">
        <a
          className="block text-sm leading-5 tracking-wider text-foreground transition-colors hover:text-muted-foreground focus-visible:focus-ring"
          href={productHref}
        >
          {item.name}
        </a>
        {item.optionsText ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {item.optionsText.replace(/^Color:\s*/i, '')}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 pt-0.5 text-right text-sm leading-5 text-foreground">
        <ProductPrice price={item.totalPrice} variant="listing" />
      </div>
    </li>
  )
}

export function CheckoutSummaryLineItems({ items }: { items: CartLineItem[] }) {
  return (
    <ul className="space-y-5">
      {items.map((item) => (
        <CheckoutSummaryLineItem item={item} key={item.id} />
      ))}
    </ul>
  )
}
