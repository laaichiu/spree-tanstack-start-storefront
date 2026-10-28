import { getCommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import { Link } from '@tanstack/react-router'

import { getOrderPlacedStatusDisplay } from '@/components/checkout/completion/order-placed-status-display'
import { getOrderPlacedTotalsDisplay } from '@/components/checkout/completion/order-placed-totals-display'
import { getOrderPlacedLineItemDisplays } from '@/components/checkout/completion/order-placed-line-item-display'
import { useMarket } from '@/components/layout/market-provider'
import { getAddressLines } from '@/lib/core/address'
import type { AddressDisplay } from '@/lib/core/address'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { OrderPlacedDetailsView } from '@/components/checkout/order-placed-details-view'
import { OrderPlacedItemsView } from '@/components/checkout/order-placed-items-view'
import { OrderPlacedTotalsView } from '@/components/checkout/order-placed-totals-view'

export function OrderPlacedDetails({ order }: { order: CheckoutOrder }) {
  const { market, t } = useMarket()
  const statusDisplay = getOrderPlacedStatusDisplay({
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillments: order.fulfillments,
    labels: {
      paymentMethodUnavailable: t('account.payment'),
      shippingMethodUnavailable: t('account.shippingMethodUnavailable'),
      statusFallback: '-',
      statusLabels: getCommerceStatusLabels(t),
    },
    paymentStatus: order.paymentStatus,
    payments: order.payments,
  })
  const orderItems = getOrderPlacedLineItemDisplays({
    items: order.items,
    locale: market.locale,
    quantityLabel: t('account.quantity'),
  }).map((item) => ({
    ...item,
    imageAlt: item.name,
    imageFallback: t('product.imageComingSoon'),
    optionsText: item.optionsText || null,
  }))
  const totals = getOrderPlacedTotalsDisplay({
    labels: {
      discount: t('cart.discount'),
      shipping: t('cart.shipping'),
      subtotal: t('cart.subtotal'),
      tax: t('cart.tax'),
    },
    locale: market.locale,
    order,
  })

  return (
    <>
      <OrderPlacedItemsView
        capabilities={{
          renderProductLink: (item, { children, className }) => (
            <Link
              className={className}
              params={{
                country: market.country,
                locale: market.locale,
                slug: item.productSlug,
              }}
              to="/$country/$locale/products/$slug"
            >
              {children}
            </Link>
          ),
        }}
        model={{
          description: t('checkout.orderItemsDescription'),
          items: orderItems,
          title: t('account.orderItems'),
        }}
      />

      <OrderPlacedDetailsView
        model={{
          billingAddress: getOrderPlacedAddressDisplay(order.billingAddress),
          copy: {
            billingAddress: t('account.billingAddress'),
            cost: t('checkout.cost'),
            fulfillment: t('checkout.fulfillment'),
            fulfillmentDetailsPending: t('checkout.fulfillmentDetailsPending'),
            orderDetails: t('checkout.orderDetails'),
            payment: t('checkout.payment'),
            paymentAmount: t('checkout.paymentAmount'),
            paymentStatus: t('checkout.paymentStatus'),
            shippingAddress: t('account.shippingAddress'),
            status: t('checkout.status'),
            tracking: t('checkout.tracking'),
          },
          fulfillments: statusDisplay.fulfillments,
          paymentStatus: statusDisplay.paymentStatus,
          payments: statusDisplay.payments,
          shippingAddress: getOrderPlacedAddressDisplay(order.shippingAddress),
        }}
      />

      <OrderPlacedTotalsView
        model={{
          rows: totals.rows,
          statusRows: [
            {
              label: t('checkout.paymentStatus'),
              value: statusDisplay.paymentStatus,
            },
            {
              label: t('checkout.fulfillmentStatus'),
              value: statusDisplay.fulfillmentStatus,
            },
          ],
          title: t('cart.total'),
          totalLabel: t('cart.total'),
          totalValue: totals.total,
        }}
      />
    </>
  )
}

function getOrderPlacedAddressDisplay(
  address: CheckoutOrder['billingAddress'],
): AddressDisplay | null {
  return address
    ? {
        fullName: address.fullName,
        lines: getAddressLines(address),
      }
    : null
}
