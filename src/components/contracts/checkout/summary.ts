import type { ReactNode } from 'react'
import type { CheckoutSummaryPresentation } from '@/components/checkout/summary/checkout-summary-display'
import type { CheckoutSummaryTotalsRowDisplay } from '@/components/checkout/summary/checkout-summary-totals-row-display'
import type { CheckoutSummaryLineItemPresentation } from '@/components/checkout/summary/checkout-summary-line-item-display'

export type CheckoutSummaryLineItemsModel = {
  imageFallbackLabel: string
  items: readonly CheckoutSummaryLineItemPresentation[]
}

export type CheckoutSummaryLineItemsCapabilities = {
  renderProductLink: (
    item: CheckoutSummaryLineItemPresentation,
    props: { children: ReactNode; className: string },
  ) => ReactNode
}

export type CheckoutSummaryTotalsLabels = {
  amountDue: string
  total: string
}
export type CheckoutSummaryTotalsModel = {
  amountDue: string | null
  currencyCode: string
  labels: CheckoutSummaryTotalsLabels
  rows: readonly CheckoutSummaryTotalsRowDisplay[]
  total: string
}

export type CheckoutSummaryShellModel = Pick<
  CheckoutSummaryPresentation,
  'total'
> & {
  isMobileOpen: boolean
  label: string
}

export type CheckoutSummaryContentSlots = {
  lineItems: ReactNode
  totals: ReactNode
}

export type CheckoutSummaryTotalsDetailRow = {
  label: string
  value: string
}
