import { getCommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { getOrderListItemAccountDisplays } from '@/components/account/account-order-list-display'
import { useMarket } from '@/components/layout/market-provider'
import { getOrderListPageModel } from '@/lib/account/contracts'
import type { OrderSummary } from '@/lib/account/contracts'
import { AccountOrdersSectionView } from '@/components/account/account-orders-section-view'
import type { AccountOrdersSectionLabels } from '@/components/account/account-orders-section-view'

export function AccountOrdersList({
  loadError,
  orders,
}: {
  loadError?: boolean
  orders: Array<OrderSummary>
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  const labels: AccountOrdersSectionLabels = {
    emptyAction: t('account.startShopping'),
    emptyDescription: t('account.noOrdersDescription'),
    emptyTitle: t('account.noOrders'),
    errorDescription: t('account.ordersLoadFailedDescription'),
    errorTitle: t('account.ordersLoadFailed'),
    readyDescription: t('account.orderHistoryDescription'),
    readyTitle: t('account.orderHistory'),
  }
  const orderLabels = {
    order: t('account.order'),
    view: t('account.viewOrder'),
  }

  const page = getOrderListPageModel({
    hasLoadError: Boolean(loadError),
    orders,
  })

  if (page.status === 'error') {
    return <AccountOrdersSectionView model={{ labels, status: 'error' }} />
  }

  if (page.status === 'empty') {
    return (
      <AccountOrdersSectionView
        model={{ labels, status: 'empty' }}
        renderEmptyAction={({ children, className }) => (
          <Link
            className={className}
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {children}
          </Link>
        )}
      />
    )
  }

  const model = {
    labels,
    orders: getOrderListItemAccountDisplays({
      labels: {
        fulfillmentUnavailable: t('account.fulfillmentUnavailable'),
        paymentUnavailable: t('account.orderStatusUnavailable'),
        statusLabels: getCommerceStatusLabels(t),
      },
      locale: market.locale,
      orders: page.orders,
    }).map((order) => ({ labels: orderLabels, order })),
    status: 'ready' as const,
  }

  return (
    <AccountOrdersSectionView
      model={model}
      renderViewLink={(orderId, { children, className }) => (
        <Link
          className={className}
          params={{ ...marketParams, id: orderId }}
          to="/$country/$locale/account/orders/$id"
        >
          {children}
        </Link>
      )}
    />
  )
}
