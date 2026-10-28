import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { OrderSummary } from '@/lib/account/contracts'
import { formatDate } from '@/components/shared/locale-format'
import { formatStatusLabel } from '@/components/shared/status-label'

export type OrderListItemAccountDisplay = {
  dateLabel: string
  displayTotal?: string
  fulfillmentStatus: string
  id: string
  number: string
  paymentStatus: string
}

export function getOrderListItemAccountDisplays({
  labels,
  locale,
  orders,
}: {
  labels: {
    statusLabels: CommerceStatusLabels
    fulfillmentUnavailable: string
    paymentUnavailable: string
  }
  locale: string
  orders: readonly OrderSummary[]
}): OrderListItemAccountDisplay[] {
  return orders.map((order) => ({
    dateLabel: formatDate(order.completedAt, locale),
    displayTotal: order.displayTotal ?? undefined,
    fulfillmentStatus: formatStatusLabel(
      order.fulfillmentStatus,
      labels.fulfillmentUnavailable,
      labels.statusLabels.fulfillment,
    ),
    id: order.id,
    number: order.number,
    paymentStatus: formatStatusLabel(
      order.paymentStatus,
      labels.paymentUnavailable,
      labels.statusLabels.payment,
    ),
  }))
}
