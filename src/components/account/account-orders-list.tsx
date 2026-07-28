import { Link } from '@tanstack/react-router'
import { CircleAlert, ShoppingBag } from 'lucide-react'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { Button } from '@/components/ui/button'
import {
  AccountEmptyState,
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
  accountTextLinkClassName,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import type { OrderSummary } from '@/lib/account/model/order'
import { formatDate } from '@/lib/i18n/messages'
import { formatStatusLabel } from '@/lib/i18n/format-status-label'

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

  if (loadError) {
    return (
      <AccountEmptyState
        description={t('account.ordersLoadFailedDescription')}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={t('account.ordersLoadFailed')}
      />
    )
  }

  if (!orders.length) {
    return (
      <AccountEmptyState
        action={
          <Link
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            <Button>{t('account.startShopping')}</Button>
          </Link>
        }
        description={t('account.noOrdersDescription')}
        icon={<ShoppingBag aria-hidden="true" className="h-5 w-5" />}
        title={t('account.noOrders')}
      />
    )
  }

  return (
    <AccountSurface>
      <AccountSectionHeader
        description={t('account.orderHistoryDescription')}
        title={t('account.orderHistory')}
      />

      <ul className="mt-6">
        {orders.map((order) => (
          <li
            className="border-b border-border py-6 first:pt-0 last:border-b-0 last:pb-0"
            key={order.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
                    {t('account.order')}
                  </p>
                  <h2 className="text-lg font-normal text-foreground">
                    #{order.number}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {formatDate(order.completedAt, market.locale)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AccountPill>
                    {formatStatusLabel(
                      order.paymentStatus,
                      t('account.orderStatusUnavailable'),
                    )}
                  </AccountPill>
                  <AccountPill>
                    {formatStatusLabel(
                      order.fulfillmentStatus,
                      t('account.fulfillmentUnavailable'),
                    )}
                  </AccountPill>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <p className="text-lg font-normal text-foreground">
                  {order.displayTotal}
                </p>
                <Link
                  className={accountTextLinkClassName}
                  params={{ ...marketParams, id: order.id }}
                  to="/$country/$locale/account/orders/$id"
                >
                  {t('account.viewOrder')}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AccountSurface>
  )
}
