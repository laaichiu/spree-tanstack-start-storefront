import { Link } from '@tanstack/react-router'

import { ProductPrice } from '@/components/shared/product-price'
import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/model/cart'
import { getConfirmedCartDeliveryTotal } from '@/lib/cart/utils/cart-shipping'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

type CartPageOrderSummaryProps = {
  cart: CartSummary
}

export function CartPageOrderSummary({ cart }: CartPageOrderSummaryProps) {
  const { market, t } = useMarket()
  const marketParams = { country: market.country, locale: market.locale }
  const confirmedDeliveryTotal = getConfirmedCartDeliveryTotal(cart)

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <section className="border border-border bg-background p-6 sm:p-7">
        <p className="text-sm leading-4 font-normal uppercase text-foreground">
          {t('cart.orderSummary')}
        </p>

        <div className="text-sm leading-6 mt-5 space-y-3 text-muted-foreground">
          <div className="flex items-center justify-between gap-4">
            <span>{t('cart.subtotal')}</span>
            <ProductPrice price={cart.itemTotal} />
          </div>
          {cart.discountTotal && cart.discountTotal.amount < 0 ? (
            <div className="flex items-center justify-between gap-4 text-foreground">
              <span>{t('cart.discount')}</span>
              <ProductPrice price={cart.discountTotal} />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <span>{t('cart.shipping')}</span>
            <div className="text-right">
              {confirmedDeliveryTotal ? (
                <ProductPrice price={confirmedDeliveryTotal} />
              ) : (
                t('cart.shippingCalculatedAtCheckout')
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>{t('cart.tax')}</span>
            <div className="text-right">
              {cart.taxTotal && cart.taxTotal.amount > 0 ? (
                <ProductPrice price={cart.taxTotal} />
              ) : (
                t('cart.shippingCalculatedAtCheckout')
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm leading-4 font-normal uppercase text-foreground">
              {t('cart.total')}
            </span>
            <ProductPrice price={cart.total} variant="detail" />
          </div>
        </div>

        <Link
          className={buttonClassName({
            className: 'mt-7 min-h-12 w-full',
            size: 'lg',
          })}
          params={{ ...marketParams, id: cart.id }}
          search={{ payment_error: undefined, payment_error_code: undefined }}
          to="/$country/$locale/checkout/$id"
        >
          {t('cart.proceedToCheckout')}
        </Link>
        <Link
          className="mt-3 inline-flex w-full justify-center text-center text-sm tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:focus-ring"
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {t('cart.continueShopping')}
        </Link>

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('cart.shippingNote')}
          </p>
          <div className="mt-4 grid gap-3 text-sm tracking-wider text-foreground uppercase sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Link
              className="underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:focus-ring"
              params={{ ...marketParams, slug: 'shipping-policy' }}
              to="/$country/$locale/policies/$slug"
            >
              {t('footer.shippingPolicy')}
            </Link>
            <Link
              className="underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:focus-ring"
              params={{ ...marketParams, slug: 'returns-policy' }}
              to="/$country/$locale/policies/$slug"
            >
              {t('footer.returnPolicy')}
            </Link>
          </div>
        </div>
      </section>
    </aside>
  )
}
