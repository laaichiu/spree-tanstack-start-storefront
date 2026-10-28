import type { OrderSummary } from './order'

export type OrderListPageModel =
  | { status: 'error' }
  | { status: 'empty' }
  | { orders: readonly OrderSummary[]; status: 'ready' }

export function getOrderListPageModel({
  hasLoadError,
  orders,
}: {
  hasLoadError: boolean
  orders: readonly OrderSummary[]
}): OrderListPageModel {
  if (hasLoadError) {
    return { status: 'error' }
  }

  if (orders.length === 0) {
    return { status: 'empty' }
  }

  return { orders, status: 'ready' }
}
