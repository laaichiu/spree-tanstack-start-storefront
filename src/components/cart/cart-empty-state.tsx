import { Link } from '@tanstack/react-router'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'

export function CartEmptyState() {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <section className="w-full px-4 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-3xl border-y border-border py-16 text-center sm:py-24">
        <h1 className="text-2xl leading-none font-normal text-foreground">
          {t('cart.emptyBagHeading')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          {t('cart.emptyCartDescription')}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            className={buttonClassName({
              className: 'min-h-12 min-w-56 px-8',
              size: 'lg',
            })}
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {t('cart.shopAllProducts')}
          </Link>
          <Link
            className="text-sm tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:focus-ring"
            params={{
              ...marketParams,
              slug: 'shipping-policy',
            }}
            to="/$country/$locale/policies/$slug"
          >
            {t('footer.shippingPolicy')}
          </Link>
        </div>
      </div>
    </section>
  )
}
