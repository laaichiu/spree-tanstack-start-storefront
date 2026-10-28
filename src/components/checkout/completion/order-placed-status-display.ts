import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import {
  getOrderPlacedFulfillmentStatus,
  getOrderPlacedPaymentStatus,
} from '@/lib/checkout/contracts'
import type {
  CheckoutFulfillment,
  CheckoutPayment,
} from '@/lib/checkout/contracts'
import { formatStatusLabel } from '@/components/shared/status-label'
import { getOrderPlacedFulfillmentDisplays } from './order-placed-fulfillment-display'
import type { OrderPlacedFulfillmentStatusDisplay } from './order-placed-fulfillment-display'
import { getOrderPlacedPaymentDisplays } from './order-placed-payment-display'
import type { OrderPlacedPaymentStatusDisplay } from './order-placed-payment-display'

export type OrderPlacedStatusDisplay = {
  fulfillmentStatus: string
  fulfillments: OrderPlacedFulfillmentStatusDisplay[]
  paymentStatus: string
  payments: OrderPlacedPaymentStatusDisplay[]
}

export function getOrderPlacedStatusDisplay({
  fulfillmentStatus,
  fulfillments,
  labels,
  paymentStatus,
  payments,
}: {
  fulfillmentStatus?: string | null
  fulfillments?: readonly CheckoutFulfillment[]
  labels: {
    statusLabels: CommerceStatusLabels
    paymentMethodUnavailable: string
    shippingMethodUnavailable: string
    statusFallback: string
  }
  paymentStatus?: string | null
  payments?: readonly CheckoutPayment[]
}): OrderPlacedStatusDisplay {
  return {
    fulfillmentStatus: formatStatusLabel(
      getOrderPlacedFulfillmentStatus({ fulfillmentStatus, fulfillments }),
      labels.statusFallback,
      labels.statusLabels.fulfillment,
    ),
    fulfillments: getOrderPlacedFulfillmentDisplays({
      fulfillments: fulfillments ?? [],
      labels,
    }),
    paymentStatus: formatStatusLabel(
      getOrderPlacedPaymentStatus({ paymentStatus, payments }),
      labels.statusFallback,
      labels.statusLabels.payment,
    ),
    payments: getOrderPlacedPaymentDisplays({
      labels,
      payments: payments ?? [],
    }),
  }
}
