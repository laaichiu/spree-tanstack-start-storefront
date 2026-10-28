import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { OrderDetail } from '@/lib/account/contracts'
import { formatDateTime } from '@/components/shared/locale-format'
import { formatStatusLabel } from '@/components/shared/status-label'

export type AccountOrderHeaderDisplay = {
  dateLabel: string
  fulfillmentStatusLabel: string
  order: AccountOrderHeaderOrder
  paymentStatusLabel: string
}

export type AccountOrderHeaderOrder = Pick<
  OrderDetail,
  | 'customerNote'
  | 'displayAmountDue'
  | 'fulfillmentStatus'
  | 'number'
  | 'paymentStatus'
  | 'totalQuantity'
> & {
  fulfillmentCount: number
}

export function getOrderHeaderAccountDisplay({
  labels,
  locale,
  order,
}: {
  labels: {
    statusLabels: CommerceStatusLabels
    fulfillmentUnavailable: string
    paymentUnavailable: string
  }
  locale: string
  order: OrderDetail
}): AccountOrderHeaderDisplay {
  return {
    dateLabel: formatDateTime(order.completedAt, locale),
    fulfillmentStatusLabel: formatStatusLabel(
      order.fulfillmentStatus,
      labels.fulfillmentUnavailable,
      labels.statusLabels.fulfillment,
    ),
    order: {
      customerNote: order.customerNote,
      displayAmountDue: order.displayAmountDue,
      fulfillmentCount: order.fulfillments.length,
      fulfillmentStatus: order.fulfillmentStatus,
      number: order.number,
      paymentStatus: order.paymentStatus,
      totalQuantity: order.totalQuantity,
    },
    paymentStatusLabel: formatStatusLabel(
      order.paymentStatus,
      labels.paymentUnavailable,
      labels.statusLabels.payment,
    ),
  }
}
