import { Link } from '@tanstack/react-router'
import { ChevronLeft, CircleAlert, PackageSearch } from 'lucide-react'
import { lazy, Suspense } from 'react'

import {
  AccountEmptyState,
  accountTextLinkClassName,
} from '@/components/account/account-ui'
import {
  OrderHeaderCard,
  OrderItemsCard,
  OrderSummaryCard,
} from '@/components/account/account-order-detail-cards'
import {
  OrderAddressSections,
  OrderStatusSections,
} from '@/components/account/account-order-detail-sections'
import { useMarket } from '@/components/layout/market-provider'
import type { OrderDetail } from '@/lib/account/model/order'

const AccountOrderReviews = lazy(async () => {
  const module = await import('@/components/reviews/account-order-reviews')

  return { default: module.AccountOrderReviews }
})

export function AccountOrderDetail({
  loadError,
  order,
  orderId,
  reviewsEnabled,
}: {
  loadError?: boolean
  order: OrderDetail | null
  orderId: string
  reviewsEnabled: boolean
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <div className="space-y-6">
      <Link
        className={accountTextLinkClassName}
        params={marketParams}
        to="/$country/$locale/account/orders"
      >
        <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t('account.backToOrders')}
      </Link>

      {loadError || !order ? (
        <AccountEmptyState
          description={t('account.orderDetailLoadFailedDescription')}
          icon={
            loadError ? (
              <CircleAlert aria-hidden="true" className="h-5 w-5" />
            ) : (
              <PackageSearch aria-hidden="true" className="h-5 w-5" />
            )
          }
          title={
            loadError
              ? t('account.orderDetailLoadFailed')
              : `${t('account.orderTitlePrefix')} ${orderId}`
          }
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <OrderHeaderCard order={order} />
            </div>
            <div className="xl:col-span-2">
              <OrderSummaryCard order={order} />
            </div>
          </div>
          <OrderItemsCard order={order} />
          {reviewsEnabled && order.fulfillmentStatus === 'shipped' ? (
            <Suspense
              fallback={
                <div
                  aria-hidden="true"
                  className="h-36 animate-pulse border border-border bg-muted motion-reduce:animate-none"
                />
              }
            >
              <AccountOrderReviews
                items={order.items.map((item) => ({
                  id: item.id,
                  imageUrl: item.imageUrl,
                  name: item.name,
                  optionsText: item.optionsText,
                  productId: item.slug,
                  variantId: item.variantId,
                }))}
                orderId={order.id}
              />
            </Suspense>
          ) : null}
          <OrderStatusSections order={order} />
          <OrderAddressSections order={order} />
        </>
      )}
    </div>
  )
}
