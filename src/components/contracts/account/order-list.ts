import type { OrderListItemAccountDisplay } from '@/components/account/account-order-list-display'

export type AccountOrderListItemLabels = {
  order: string
  view: string
}

export type AccountOrderListItemModel = {
  labels: AccountOrderListItemLabels
  order: OrderListItemAccountDisplay
}

export type AccountOrdersSectionLabels = {
  emptyAction: string
  emptyDescription: string
  emptyTitle: string
  errorDescription: string
  errorTitle: string
  readyDescription: string
  readyTitle: string
}

export type AccountOrdersSectionModel =
  | {
      labels: AccountOrdersSectionLabels
      status: 'error'
    }
  | {
      labels: AccountOrdersSectionLabels
      status: 'empty'
    }
  | {
      labels: AccountOrdersSectionLabels
      orders: readonly AccountOrderListItemModel[]
      status: 'ready'
    }

export type AccountOrderListStateModel = {
  description: string
  state: 'error' | 'empty'
  title: string
}
