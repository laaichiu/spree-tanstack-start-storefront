import type { CartSummary } from '@/lib/cart/contracts'
import {
  getCheckoutSummaryRows,
  getCheckoutSummaryTotals,
} from '@/lib/checkout/contracts'
import type {
  CheckoutDiscountBreakdownItem,
  CheckoutSummaryRow,
} from '@/lib/checkout/contracts'
import { formatMoney } from '@/components/shared/money-display'

export type CheckoutSummaryPresentationLabels = {
  additionalDiscount: string
  discount: string
  freeShipping: string
  giftCardOrStoreCredit: string
  shipping: string
  shippingPending: string
  subtotal: string
  tax: string
}

export type CheckoutSummaryPresentationRow = {
  details: { label: string; value: string }[]
  kind: CheckoutSummaryRow['kind']
  label: string
  status: 'available' | 'pending' | null
  value: string
}

export type CheckoutSummaryPresentation = {
  amountDue: string | null
  currencyCode: string
  rows: CheckoutSummaryPresentationRow[]
  total: string
}

export function getCheckoutSummaryPresentation({
  cart,
  labels,
  locale,
}: {
  cart: CartSummary
  labels: CheckoutSummaryPresentationLabels
  locale: string
}): CheckoutSummaryPresentation {
  const summary = getCheckoutSummaryTotals(cart)
  const labelsByKind: Record<CheckoutSummaryRow['kind'], string> = {
    credit: labels.giftCardOrStoreCredit,
    discount: labels.discount,
    shipping: labels.shipping,
    subtotal: labels.subtotal,
    tax: labels.tax,
  }

  return {
    amountDue: summary.showAmountDue
      ? formatMoney(summary.amountDue, locale)
      : null,
    currencyCode: summary.currencyCode,
    rows: getCheckoutSummaryRows(summary, cart).map((row) => ({
      details:
        row.kind === 'discount'
          ? row.details.map((discount) => ({
              label: getCheckoutDiscountLabel(discount, labels),
              value: formatMoney(discount.amount, locale),
            }))
          : [],
      kind: row.kind,
      label: labelsByKind[row.kind],
      status: row.kind === 'shipping' ? row.status : null,
      value:
        row.kind === 'shipping' && row.status === 'pending'
          ? labels.shippingPending
          : formatMoney(row.value, locale),
    })),
    total: formatMoney(summary.total, locale),
  }
}

function getCheckoutDiscountLabel(
  discount: CheckoutDiscountBreakdownItem,
  labels: Pick<
    CheckoutSummaryPresentationLabels,
    'additionalDiscount' | 'discount' | 'freeShipping'
  >,
) {
  if (discount.label) {
    return discount.label
  }

  switch (discount.fallback) {
    case 'additional_discount':
      return labels.additionalDiscount
    case 'free_shipping':
      return labels.freeShipping
    case 'discount':
    default:
      return labels.discount
  }
}
