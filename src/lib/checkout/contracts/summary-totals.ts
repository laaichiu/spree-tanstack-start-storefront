import type { CartSummary } from '../../cart/contracts'
import type { Money } from '@/lib/core/money'

import type { CheckoutDiscountBreakdownItem } from './summary'
import {
  getAppliedCheckoutCreditAmount,
  getCheckoutAmountDue,
  getCheckoutDiscountBreakdown,
} from './summary'
import { getCheckoutSummaryLineVisibility } from './summary-visibility'

export type CheckoutSummaryTotals = {
  amountDue: Money | null
  appliedCheckoutCreditAmount: Money | null
  currencyCode: string
  discountBreakdown: CheckoutDiscountBreakdownItem[]
  hasSelectedShippingRate: boolean
  itemTotal: Money | null
  shipping: Money | null
  showAmountDue: boolean
  showDiscount: boolean
  showDiscountBreakdown: boolean
  showTax: boolean
  taxTotal: Money | null
  total: Money | null
}

export type CheckoutSummaryRow =
  | { kind: 'subtotal'; value: Money | null }
  | {
      kind: 'shipping'
      status: 'available' | 'pending'
      value: Money | null
    }
  | {
      details: readonly CheckoutDiscountBreakdownItem[]
      kind: 'discount'
      value: Money | null
    }
  | { kind: 'tax'; value: Money | null }
  | { kind: 'credit'; value: Money | null }

type CheckoutSummaryTotalsCart = CartSummary & {
  amountDue?: Money | null
}

export function getCheckoutSummaryTotals(
  cart: CheckoutSummaryTotalsCart,
): CheckoutSummaryTotals {
  const amountDue = getCheckoutAmountDue(cart)
  const discountBreakdown = getCheckoutDiscountBreakdown(cart)
  const { showDiscount, showTax } = getCheckoutSummaryLineVisibility(cart)
  const removableDiscountCount = cart.appliedDiscounts.filter(
    (discount) => discount.code,
  ).length
  const hasSelectedShippingRate = cart.shippingRates.some(
    (rate) => rate.selected,
  )

  return {
    amountDue,
    appliedCheckoutCreditAmount: getAppliedCheckoutCreditAmount(cart),
    currencyCode: cart.currencyCode,
    discountBreakdown,
    hasSelectedShippingRate,
    itemTotal: cart.itemTotal,
    shipping: hasSelectedShippingRate ? cart.deliveryTotal : null,
    showAmountDue: Boolean(
      amountDue && cart.total && amountDue.amount !== cart.total.amount,
    ),
    showDiscount,
    showDiscountBreakdown: discountBreakdown.length > removableDiscountCount,
    showTax,
    taxTotal: cart.taxTotal,
    total: cart.total,
  }
}

export function getCheckoutSummaryRows(
  summary: CheckoutSummaryTotals,
  cart: Pick<CartSummary, 'discountTotal'>,
): CheckoutSummaryRow[] {
  const rows: CheckoutSummaryRow[] = [
    { kind: 'subtotal', value: summary.itemTotal },
    {
      kind: 'shipping',
      status: summary.hasSelectedShippingRate ? 'available' : 'pending',
      value: summary.shipping,
    },
  ]

  if (summary.showDiscount) {
    rows.push({
      details: summary.showDiscountBreakdown ? summary.discountBreakdown : [],
      kind: 'discount',
      value: cart.discountTotal,
    })
  }

  if (summary.showTax) {
    rows.push({ kind: 'tax', value: summary.taxTotal })
  }

  if (summary.appliedCheckoutCreditAmount) {
    rows.push({
      kind: 'credit',
      value: summary.appliedCheckoutCreditAmount,
    })
  }

  return rows
}
