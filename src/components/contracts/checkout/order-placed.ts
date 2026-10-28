import type { ReactNode } from 'react'
import type { AddressDisplay } from '@/lib/core/address'
import type { OrderPlacedLineItemDisplay } from '@/components/checkout/completion/order-placed-line-item-display'
import type { OrderPlacedHeaderDisplay } from '@/components/checkout/completion/order-placed-header-display'
import type { OrderPlacedStatusDisplay } from '@/components/checkout/completion/order-placed-status-display'
import type { OrderPlacedTotalRow } from '@/components/checkout/completion/order-placed-totals-display'
import type { LayoutLinkRenderer } from '../layout/primitives'

type OrderPlacedItem = Omit<OrderPlacedLineItemDisplay, 'optionsText'> & {
  imageAlt: string
  imageFallback: string
  optionsText: string | null
}

type OrderPlacedProductLink = (
  item: OrderPlacedItem,
  props: { children: ReactNode; className: string },
) => ReactNode

export type OrderPlacedItemsCapabilities = {
  renderProductLink: OrderPlacedProductLink
}

export type OrderPlacedItemsModel = {
  description: string
  items: readonly OrderPlacedItem[]
  title: string
}
export type OrderPlacedTotalsModel = {
  rows: readonly OrderPlacedTotalRow[]
  statusRows: readonly OrderPlacedTotalRow[]
  title: string
  totalLabel: string
  totalValue: string
}
export type OrderPlacedDetailsCopy = {
  billingAddress: string
  cost: string
  fulfillment: string
  fulfillmentDetailsPending: string
  orderDetails: string
  payment: string
  paymentAmount: string
  paymentStatus: string
  shippingAddress: string
  status: string
  tracking: string
}
export type OrderPlacedDetailsModel = {
  billingAddress: AddressDisplay | null
  copy: OrderPlacedDetailsCopy
  fulfillments: readonly OrderPlacedStatusDisplay['fulfillments'][number][]
  paymentStatus: string
  payments: readonly OrderPlacedStatusDisplay['payments'][number][]
  shippingAddress: AddressDisplay | null
}

export type OrderPlacedPageCopy = {
  backToStorefront: string
  confirmationSentTo: string
  continueShopping: string
  order: string
  orderPlacedPreparing: string
  orderPlacedTitle: string
  orderReference: string
  unavailableDescription: string
  unavailableTitle: string
  thanksForOrder: string
}

export type OrderPlacedPageDisplayModel =
  | {
      copy: OrderPlacedPageCopy
      status: 'unavailable'
    }
  | {
      copy: OrderPlacedPageCopy
      header: OrderPlacedHeaderDisplay
      status: 'ready'
    }

export type OrderPlacedPageCapabilities = {
  renderProductsLink: LayoutLinkRenderer
  renderStorefrontLink: LayoutLinkRenderer
}

export type OrderPlacedPageProps = {
  capabilities: OrderPlacedPageCapabilities
  details: ReactNode
  model: OrderPlacedPageDisplayModel
}
