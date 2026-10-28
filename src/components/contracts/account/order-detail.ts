import type { ReactNode } from 'react'
import type { AddressDisplay } from '@/lib/core/address'
import type { OrderDetailPageModel } from '@/lib/account/contracts'
import type { AccountOrderHeaderDisplay } from '@/components/account/account-order-header-display'
import type { AccountOrderStatusSectionDisplay } from '@/components/account/account-order-status-display'
import type { AccountOrderSummaryDisplay } from '@/components/account/account-order-summary-display'
import type { OrderLineItemDisplay } from '@/components/account/account-order-line-item-display'

export type AccountOrderHeaderLabels = {
  amountDue: string
  fulfillmentStatus: string
  items: string
  order: string
  orderTitlePrefix: string
  paymentStatus: string
  placedOn: string
  shipments: string
  specialInstructions: string
}

export type AccountOrderHeaderModel = Pick<
  AccountOrderHeaderDisplay,
  'dateLabel' | 'order'
> & {
  labels: AccountOrderHeaderLabels
}

export type AccountOrderItemsLabels = {
  each: string
  lineTotal: string
  noImage: string
  orderItems: string
  orderItemsDescription: string
  quantity: string
}

export type AccountOrderItemsModel = {
  items: readonly OrderLineItemDisplay[]
  labels: AccountOrderItemsLabels
}

export type AccountOrderAddress = AddressDisplay

export type AccountOrderAddressesModel = {
  billingAddress: AccountOrderAddress | null
  labels: {
    billing: string
    shipping: string
  }
  shippingAddress: AccountOrderAddress | null
}

export type AccountOrderStatusLabels = {
  authorizationCode: string
  fulfilledAt: string
  fulfillmentDescription: string
  itemsInShipment: string
  noFulfillments: string
  noPayments: string
  noTrackingInfo: string
  paymentAmount: string
  paymentDescription: string
  paymentInformation: string
  paymentReference: string
  shipment: string
  shippingCost: string
  shippingOrigin: string
  trackingNumber: string
  trackShipment: string
}

export type AccountOrderStatusModel = AccountOrderStatusSectionDisplay & {
  labels: AccountOrderStatusLabels
}

export type AccountOrderStatusTrackingLink = (
  url: string,
  props: { children: ReactNode; className: string },
) => ReactNode

export type AccountOrderSummaryModel = AccountOrderSummaryDisplay & {
  description: string
  title: string
  totalLabel: string
}

export type AccountOrderDetailPageState = {
  status: OrderDetailPageModel['status']
}

export type AccountOrderDetailPageLabels = {
  loadFailed: string
  loadFailedDescription: string
  missingOrder: string
}

export type AccountOrderDetailPageModel = {
  labels: AccountOrderDetailPageLabels
  state: AccountOrderDetailPageState
}

export type AccountOrderDetailPageSections = {
  addresses: ReactNode
  header: ReactNode
  items: ReactNode
  orderStatus: ReactNode
  reviews?: ReactNode
  summary: ReactNode
}

type AccountOrderDetailPageBaseProps = {
  backLink: ReactNode
  model: AccountOrderDetailPageModel
}

export type AccountOrderDetailPageProps =
  | (AccountOrderDetailPageBaseProps & {
      model: AccountOrderDetailPageModel & {
        state: { status: 'ready' }
      }
      sections: AccountOrderDetailPageSections
    })
  | (AccountOrderDetailPageBaseProps & {
      model: AccountOrderDetailPageModel & {
        state: Exclude<AccountOrderDetailPageState, { status: 'ready' }>
      }
    })
