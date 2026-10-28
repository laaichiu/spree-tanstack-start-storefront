import { getCommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import { getOrderStatusSectionDisplay } from '@/components/account/account-order-status-display'
import { getOrderAddressDisplay } from '@/components/account/account-address-display'
import type { OrderDetail } from '@/lib/account/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { AccountOrderAddressesView } from '@/components/account/account-order-addresses-view'
import { AccountOrderStatusView } from '@/components/account/account-order-status-view'

export function OrderStatusSections({ order }: { order: OrderDetail }) {
  const { market, t } = useMarket()
  const display = getOrderStatusSectionDisplay({
    fulfillments: order.fulfillments,
    labels: {
      noTrackingInfo: t('account.noTrackingInfo'),
      paymentMethodUnavailable: t('account.payment'),
      shippingMethodUnavailable: t('account.shippingMethodUnavailable'),
      shipment: t('account.shipment'),
      shipmentNumber: t('account.shipmentNumber'),
      statusFallback: '-',
      statusLabels: getCommerceStatusLabels(t),
    },
    locale: market.locale,
    payments: order.payments,
  })
  const model = {
    ...display,
    labels: {
      authorizationCode: t('account.authorizationCode'),
      fulfilledAt: t('account.fulfilledAt'),
      fulfillmentDescription: t('account.shipmentDescription'),
      itemsInShipment: t('account.itemsInShipment'),
      noFulfillments: t('account.noFulfillmentsYet'),
      noPayments: t('account.noPaymentsRecorded'),
      noTrackingInfo: t('account.noTrackingInfo'),
      paymentAmount: t('account.paymentAmount'),
      paymentDescription: t('account.paymentDescription'),
      paymentInformation: t('account.paymentInformation'),
      paymentReference: t('account.paymentReference'),
      shipment: t('account.shipment'),
      shippingCost: t('account.shippingCost'),
      shippingOrigin: t('account.shippingOrigin'),
      trackingNumber: t('account.trackingNumber'),
      trackShipment: t('account.trackShipment'),
    },
  }

  return (
    <AccountOrderStatusView
      model={model}
      renderTrackingLink={(url, { children, className }) => (
        <a
          className={className}
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {children}
        </a>
      )}
    />
  )
}

export function OrderAddressSections({ order }: { order: OrderDetail }) {
  const { t } = useMarket()

  return (
    <AccountOrderAddressesView
      model={{
        billingAddress: getOrderAddressDisplay(order.billingAddress),
        labels: {
          billing: t('account.billingAddress'),
          shipping: t('account.shippingAddress'),
        },
        shippingAddress: getOrderAddressDisplay(order.shippingAddress),
      }}
    />
  )
}
