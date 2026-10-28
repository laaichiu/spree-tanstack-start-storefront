import { lazy, Suspense } from 'react'
import { Link } from '@tanstack/react-router'

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
import { getOrderDetailPageModel } from '@/lib/account/contracts'
import type { OrderDetail } from '@/lib/account/contracts'
import { AccountOrderDetailBackLinkView } from '@/components/account/account-order-detail-back-link-view'
import { AccountOrderReviewsLoadingStateView } from '@/components/account/account-order-reviews-loading-state-view'
import { AccountOrderDetailPageView } from '@/components/account/account-order-detail-page-view'
import { getOrderReviewItems } from '@/components/reviews/order-review-items'

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

  const page = getOrderDetailPageModel({
    hasLoadError: Boolean(loadError),
    order,
    orderId,
  })

  const missingOrderId = page.status === 'missing' ? page.orderId : orderId
  const labels = {
    loadFailed: t('account.orderDetailLoadFailed'),
    loadFailedDescription: t('account.orderDetailLoadFailedDescription'),
    missingOrder: `${t('account.orderTitlePrefix')} ${missingOrderId}`,
  }

  const backLink = (
    <AccountOrderDetailBackLinkView
      label={t('account.backToOrders')}
      renderLink={({ children, className }) => (
        <Link
          className={className}
          params={marketParams}
          to="/$country/$locale/account/orders"
        >
          {children}
        </Link>
      )}
    />
  )

  if (page.status !== 'ready') {
    return (
      <AccountOrderDetailPageView
        backLink={backLink}
        model={{ labels, state: { status: page.status } }}
      />
    )
  }

  const sections = {
    addresses: <OrderAddressSections order={page.order} />,
    header: <OrderHeaderCard order={page.order} />,
    items: <OrderItemsCard order={page.order} />,
    orderStatus: <OrderStatusSections order={page.order} />,
    reviews:
      reviewsEnabled && isOrderReviewEligible(page.order) ? (
        <Suspense fallback={<AccountOrderReviewsLoadingStateView />}>
          <AccountOrderReviews
            items={getOrderReviewItems(page.order.items)}
            orderId={page.order.id}
          />
        </Suspense>
      ) : undefined,
    summary: <OrderSummaryCard order={page.order} />,
  }

  return (
    <AccountOrderDetailPageView
      backLink={backLink}
      model={{ labels, state: { status: 'ready' } }}
      sections={sections}
    />
  )
}

function isOrderReviewEligible(order: OrderDetail) {
  return ['fulfilled', 'delivered', 'shipped'].includes(
    order.fulfillmentStatus ?? '',
  )
}
