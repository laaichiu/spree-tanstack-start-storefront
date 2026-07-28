import type { CartSummary } from '@/lib/cart/model/cart'
import type { Money } from '@/lib/money/money'

const MONEY_EPSILON = 0.005

export type CheckoutSummaryAmountCart = Pick<
  CartSummary,
  'currencyCode' | 'total'
> & {
  amountDue?: Money
}

export type CheckoutDiscountBreakdownItem = {
  id: string
  label: string
  amount: Money
  source: 'discount' | 'shipping' | 'other'
}

export type CheckoutDiscountBreakdownLabels = {
  additionalDiscount: string
  discount: string
  freeShipping: string
}

export type CheckoutDiscountBreakdownCart = Pick<
  CartSummary,
  | 'appliedDiscounts'
  | 'currencyCode'
  | 'discountTotal'
  | 'shippingDiscountTotal'
>

function roundMoneyAmount(value: number) {
  return Math.round(value * 100) / 100
}

function hasMeaningfulAmount(value: number) {
  return Math.abs(value) >= MONEY_EPSILON
}

export function getCheckoutAmountDue(
  cart: CheckoutSummaryAmountCart,
): Money | null {
  return cart.amountDue && cart.amountDue.currencyCode === cart.currencyCode
    ? cart.amountDue
    : null
}

export function getAppliedCheckoutCreditAmount(
  cart: CheckoutSummaryAmountCart,
): Money | null {
  const amountDue = getCheckoutAmountDue(cart)

  if (!amountDue || amountDue.amount >= cart.total.amount) {
    return null
  }

  return {
    amount: amountDue.amount - cart.total.amount,
    currencyCode: cart.currencyCode,
  }
}

export function getCheckoutDiscountBreakdown(
  cart: CheckoutDiscountBreakdownCart,
  labels: CheckoutDiscountBreakdownLabels,
): CheckoutDiscountBreakdownItem[] {
  const breakdown: CheckoutDiscountBreakdownItem[] =
    cart.appliedDiscounts.flatMap((discount) => {
      const amount = roundMoneyAmount(discount.amount.amount)

      if (!hasMeaningfulAmount(amount)) {
        return []
      }

      return [
        {
          id: discount.id,
          label:
            discount.code?.trim() || discount.name.trim() || labels.discount,
          amount: {
            amount,
            currencyCode: cart.currencyCode,
          },
          source: 'discount',
        },
      ]
    })

  const discountTotal = roundMoneyAmount(cart.discountTotal.amount)
  const itemizedTotal = roundMoneyAmount(
    breakdown.reduce((total, item) => total + item.amount.amount, 0),
  )
  const remainder = roundMoneyAmount(discountTotal - itemizedTotal)

  if (!hasMeaningfulAmount(remainder)) {
    return breakdown
  }

  const shippingDiscountTotal = roundMoneyAmount(
    cart.shippingDiscountTotal.amount,
  )
  const isShippingRemainder =
    hasMeaningfulAmount(shippingDiscountTotal) &&
    Math.abs(remainder - shippingDiscountTotal) < MONEY_EPSILON

  breakdown.push({
    id: isShippingRemainder ? 'shipping-discount' : 'additional-discount',
    label: isShippingRemainder
      ? labels.freeShipping
      : labels.additionalDiscount,
    amount: {
      amount: remainder,
      currencyCode: cart.currencyCode,
    },
    source: isShippingRemainder ? 'shipping' : 'other',
  })

  return breakdown
}
