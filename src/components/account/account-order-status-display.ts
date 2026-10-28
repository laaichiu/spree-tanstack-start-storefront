import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { OrderFulfillment, OrderPayment } from '@/lib/account/contracts'
import { getOrderFulfillmentAccountDisplays } from './account-order-fulfillment-display'
import type { AccountOrderFulfillmentDisplay } from './account-order-fulfillment-display'
import { getOrderPaymentAccountDisplays } from './account-order-payment-display'
import type { AccountOrderPaymentDisplay } from './account-order-payment-display'

export type AccountOrderStatusSectionDisplay = {
  fulfillments: AccountOrderFulfillmentDisplay[]
  payments: AccountOrderPaymentDisplay[]
}

export function getOrderStatusSectionDisplay({
  fulfillments,
  labels,
  locale,
  payments,
}: {
  fulfillments: readonly OrderFulfillment[]
  labels: {
    statusLabels: CommerceStatusLabels
    noTrackingInfo: string
    paymentMethodUnavailable: string
    shippingMethodUnavailable: string
    shipment: string
    shipmentNumber: string
    statusFallback: string
  }
  locale: string
  payments: readonly OrderPayment[]
}): AccountOrderStatusSectionDisplay {
  return {
    fulfillments: getOrderFulfillmentAccountDisplays({
      fulfillments,
      labels,
      locale,
    }),
    payments: getOrderPaymentAccountDisplays({
      labels,
      payments,
    }),
  }
}
