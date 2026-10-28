import { getCommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import { Link } from '@tanstack/react-router'

import { getOrderLineItemDisplays } from '@/components/account/account-order-line-item-display'
import { getOrderHeaderAccountDisplay } from '@/components/account/account-order-header-display'
import { getOrderSummaryAccountDisplay } from '@/components/account/account-order-summary-display'
import { useMarket } from '@/components/layout/market-provider'
import type { OrderDetail } from '@/lib/account/contracts'
import { AccountOrderHeaderView } from '@/components/account/account-order-header-view'
import { AccountOrderItemsView } from '@/components/account/account-order-items-view'
import { AccountOrderSummaryView } from '@/components/account/account-order-summary-view'

export function OrderHeaderCard({ order }: { order: OrderDetail }) {
  const { market, t } = useMarket()
  const display = getOrderHeaderAccountDisplay({
    labels: {
      fulfillmentUnavailable: t('account.fulfillmentUnavailable'),
      paymentUnavailable: t('account.orderStatusUnavailable'),
      statusLabels: getCommerceStatusLabels(t),
    },
    locale: market.locale,
    order,
  })
  const model = {
    dateLabel: display.dateLabel,
    labels: {
      amountDue: t('account.amountDue'),
      fulfillmentStatus: display.fulfillmentStatusLabel,
      items: t('account.itemsLabel'),
      order: t('account.order'),
      orderTitlePrefix: t('account.orderTitlePrefix'),
      paymentStatus: display.paymentStatusLabel,
      placedOn: t('account.placedOn'),
      shipments: t('account.shipmentsLabel'),
      specialInstructions: t('account.specialInstructions'),
    },
    order: display.order,
  }

  return <AccountOrderHeaderView model={model} />
}

export function OrderSummaryCard({ order }: { order: OrderDetail }) {
  const { t } = useMarket()
  const display = getOrderSummaryAccountDisplay({
    labels: {
      amountDue: t('account.amountDue'),
      amountLabels: {
        discount: t('account.discount'),
        'gift-card': t('account.giftCardLabel'),
        shipping: t('cart.shipping'),
        subtotal: t('cart.subtotal'),
        'store-credit': t('account.storeCredit'),
        tax: t('cart.tax'),
      },
      orderPaidInFull: t('account.orderPaidInFull'),
    },
    order,
  })
  const model = {
    ...display,
    description: t('account.orderSummaryDescription'),
    title: t('cart.orderSummary'),
    totalLabel: t('cart.total'),
  }

  return <AccountOrderSummaryView model={model} />
}

export function OrderItemsCard({ order }: { order: OrderDetail }) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountOrderItemsView
      model={{
        items: getOrderLineItemDisplays(order.items),
        labels: {
          each: t('account.each'),
          lineTotal: t('account.lineTotal'),
          noImage: t('account.noImage'),
          orderItems: t('account.orderItems'),
          orderItemsDescription: t('account.orderItemsDescription'),
          quantity: t('account.quantity'),
        },
      }}
      renderProductLink={(item, { children, className }) =>
        item.slug ? (
          <Link
            className={className}
            params={{ ...marketParams, slug: item.slug }}
            to="/$country/$locale/products/$slug"
          >
            {children}
          </Link>
        ) : (
          children
        )
      }
    />
  )
}
