import type { OrderDetail } from './order'

export type OrderDetailPageModel =
  | { status: 'error' }
  | { orderId: string; status: 'missing' }
  | { order: OrderDetail; status: 'ready' }

export function getOrderDetailPageModel({
  hasLoadError,
  order,
  orderId,
}: {
  hasLoadError: boolean
  order: OrderDetail | null
  orderId: string
}): OrderDetailPageModel {
  if (hasLoadError) {
    return { status: 'error' }
  }

  if (!order) {
    return { orderId, status: 'missing' }
  }

  return { order, status: 'ready' }
}
