import type {
  CartShippingSummary,
  CartSummaryAmounts,
} from '@/lib/cart/contracts'
import type { CartDrawerFooterPresentation } from '@/components/contracts/cart/drawer'
import { getCartSummaryPresentation } from './cart-summary-display'

export function getCartDrawerFooterPresentation({
  amounts,
  labels,
  locale,
  shippingSummary,
}: {
  amounts: CartSummaryAmounts
  labels: {
    calculatedAtCheckout: string
    free: string
  }
  locale: string
  shippingSummary: CartShippingSummary
}): CartDrawerFooterPresentation {
  const summary = getCartSummaryPresentation(
    shippingSummary.kind === 'amount'
      ? { ...amounts, shipping: shippingSummary.amount }
      : amounts,
    locale,
  )

  return {
    itemTotal: summary.itemTotal,
    shipping: getShippingLabel({
      formattedAmount: summary.shipping,
      labels,
      shippingSummary,
    }),
    total: summary.total,
  }
}

function getShippingLabel({
  formattedAmount,
  labels,
  shippingSummary,
}: {
  formattedAmount: string | undefined
  labels: { calculatedAtCheckout: string; free: string }
  shippingSummary: CartShippingSummary
}): string {
  switch (shippingSummary.kind) {
    case 'calculated':
      return labels.calculatedAtCheckout
    case 'free':
      return labels.free
    case 'amount':
      return formattedAmount ?? '—'
  }
}
