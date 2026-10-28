import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { CheckoutRouteErrorStateView } from '@/components/checkout/checkout-route-error-state-view'

type CheckoutRouteErrorStateProps = {
  checkoutTarget?: {
    cartId?: string
  }
  description?: string
  /** Diagnostic errors must never become customer-facing checkout copy. */
  error?: unknown
  title?: string
}

export function CheckoutRouteErrorState({
  checkoutTarget,
  description,
  title,
}: CheckoutRouteErrorStateProps) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const checkoutCartId = checkoutTarget?.cartId

  return (
    <CheckoutRouteErrorStateView
      capabilities={{
        renderCheckoutLink: checkoutTarget
          ? checkoutCartId
            ? (content, className) => (
                <Link
                  className={className}
                  params={{ ...marketParams, id: checkoutCartId }}
                  search={{
                    payment_error: undefined,
                    payment_error_code: undefined,
                  }}
                  to="/$country/$locale/checkout/$id"
                >
                  {content}
                </Link>
              )
            : (content, className) => (
                <Link
                  className={className}
                  params={marketParams}
                  to="/$country/$locale/checkout"
                >
                  {content}
                </Link>
              )
          : undefined,
        renderProductsLink: (content, className) => (
          <Link
            className={className}
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {content}
          </Link>
        ),
      }}
      model={{
        checkoutLabel: checkoutTarget
          ? t('checkout.returnToCheckout')
          : undefined,
        description:
          description ?? t('checkout.orderPlacedUnavailableDescription'),
        eyebrow: t('checkout.checkout'),
        productsLabel: t('cart.continueShopping'),
        title: title ?? t('checkout.checkoutLoadFailed'),
      }}
    />
  )
}
