import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { OrderFulfillment } from '@/lib/account/contracts'
import { formatDateTime } from '@/components/shared/locale-format'
import { formatStatusLabel } from '@/components/shared/status-label'

export type AccountOrderFulfillmentDisplay = {
  fulfilledAt?: string
  id: string
  itemQuantity: string
  methodName: string
  originLabel?: string
  shipmentLabel: string
  shippingCost: string
  statusLabel: string
  tracking: string
  trackingUrl?: string
}

export function getOrderFulfillmentAccountDisplays({
  fulfillments,
  labels,
  locale,
}: {
  fulfillments: readonly OrderFulfillment[]
  labels: {
    statusLabels: CommerceStatusLabels
    noTrackingInfo: string
    shippingMethodUnavailable: string
    shipment: string
    shipmentNumber: string
    statusFallback: string
  }
  locale: string
}): AccountOrderFulfillmentDisplay[] {
  return fulfillments.map((fulfillment) => ({
    fulfilledAt: fulfillment.fulfilledAt
      ? formatDateTime(fulfillment.fulfilledAt, locale)
      : undefined,
    id: fulfillment.id,
    itemQuantity: String(fulfillment.itemQuantity),
    methodName: fulfillment.methodName || labels.shippingMethodUnavailable,
    originLabel: fulfillment.originLabel ?? undefined,
    shipmentLabel: fulfillment.number
      ? `${labels.shipmentNumber} ${fulfillment.number}`
      : labels.shipment,
    shippingCost: fulfillment.displayCost ?? '—',
    statusLabel: formatStatusLabel(
      fulfillment.status,
      labels.statusFallback,
      labels.statusLabels.fulfillment,
    ),
    tracking: fulfillment.tracking || labels.noTrackingInfo,
    trackingUrl: fulfillment.trackingUrl ?? undefined,
  }))
}
