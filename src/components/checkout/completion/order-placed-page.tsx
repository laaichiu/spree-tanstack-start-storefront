import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { getOrderPlacedHeaderDisplay } from '@/components/checkout/completion/order-placed-header-display'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { OrderPlacedPageView } from '@/components/checkout/order-placed-page-view'

import { CheckoutRouteErrorState } from '../checkout-route-error-state'
import { OrderPlacedDetails } from './order-placed-details'

export function OrderPlacedPage({ order }: { order: CheckoutOrder | null }) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const copy = {
    backToStorefront: t('checkout.backToStorefront'),
    confirmationSentTo: t('checkout.confirmationSentTo'),
    continueShopping: t('cart.continueShopping'),
    order: t('account.order'),
    orderPlacedPreparing: t('checkout.orderPlacedPreparing'),
    orderPlacedTitle: t('checkout.orderPlacedTitle'),
    orderReference: t('checkout.orderReference'),
    unavailableDescription: t('checkout.orderPlacedUnavailableDescription'),
    unavailableTitle: t('checkout.orderPlacedUnavailable'),
    thanksForOrder: t('checkout.thanksForOrder'),
  }
  const model = order
    ? {
        copy,
        header: getOrderPlacedHeaderDisplay(order),
        status: 'ready' as const,
      }
    : { copy, status: 'unavailable' as const }

  return (
    <OrderPlacedPageView
      capabilities={{
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
        renderStorefrontLink: (content, className) => (
          <Link
            className={className}
            params={marketParams}
            to="/$country/$locale"
          >
            {content}
          </Link>
        ),
      }}
      model={model}
      details={order && <OrderPlacedDetails order={order} />}
    />
  )
}

export function OrderPlacedError({ error }: { error: unknown }) {
  const { t } = useMarket()

  return (
    <CheckoutRouteErrorState
      description={t('checkout.orderPlacedUnavailableDescription')}
      error={error}
      title={t('checkout.orderPlacedUnavailable')}
    />
  )
}
