import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { CheckoutFulfillment } from '@/lib/checkout/contracts'
import { formatStatusLabel } from '@/components/shared/status-label'

export type OrderPlacedFulfillmentStatusDisplay = {
  cost: string
  id: string
  methodName: string
  status: string
  tracking: string | null
  trackingHref: string | null
}

export function getOrderPlacedFulfillmentDisplays({
  fulfillments,
  labels,
}: {
  fulfillments: readonly CheckoutFulfillment[]
  labels: {
    statusLabels: CommerceStatusLabels
    shippingMethodUnavailable: string
    statusFallback: string
  }
}): OrderPlacedFulfillmentStatusDisplay[] {
  return fulfillments.map((fulfillment) => ({
    cost: fulfillment.displayCost ?? '—',
    id: fulfillment.id,
    methodName: fulfillment.methodName || labels.shippingMethodUnavailable,
    status: formatStatusLabel(
      fulfillment.status,
      labels.statusFallback,
      labels.statusLabels.fulfillment,
    ),
    tracking: fulfillment.tracking,
    trackingHref: fulfillment.trackingUrl,
  }))
}
