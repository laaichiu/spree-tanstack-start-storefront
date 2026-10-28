import type { CartSummary } from '../../cart/contracts'
import type { Money } from '@/lib/core/money'

export type CheckoutSummaryAmountCart = Pick<
  CartSummary,
  'currencyCode' | 'total'
> & {
  amountDue?: Money | null
}

export type CheckoutDiscountBreakdownItem = {
  id: string
  label: string | null
  amount: Money
  source: 'discount' | 'shipping' | 'other'
  fallback: CheckoutDiscountBreakdownFallback | null
}

export type CheckoutDiscountBreakdownFallback =
  'additional_discount' | 'discount' | 'free_shipping'

export type CheckoutDiscountBreakdownCart = Pick<
  CartSummary,
  | 'appliedDiscounts'
  | 'currencyCode'
  | 'discountTotal'
  | 'shippingDiscountTotal'
>

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

  if (!amountDue || !cart.total || amountDue.amount >= cart.total.amount) {
    return null
  }

  return {
    amount: amountDue.amount - cart.total.amount,
    currencyCode: cart.currencyCode,
  }
}

export function getCheckoutDiscountBreakdown(
  cart: CheckoutDiscountBreakdownCart,
): CheckoutDiscountBreakdownItem[] {
  const fractionDigits =
    new Intl.NumberFormat('en', {
      currency: cart.currencyCode,
      style: 'currency',
    }).resolvedOptions().maximumFractionDigits ?? 2
  const factor = 10 ** fractionDigits
  const epsilon = 0.5 / factor
  const roundMoneyAmount = (value: number) =>
    Math.round(value * factor) / factor
  const hasMeaningfulAmount = (value: number) => Math.abs(value) >= epsilon

  const breakdown: CheckoutDiscountBreakdownItem[] =
    cart.appliedDiscounts.flatMap((discount) => {
      if (!discount.amount) {
        return []
      }

      const amount = roundMoneyAmount(discount.amount.amount)

      if (!hasMeaningfulAmount(amount)) {
        return []
      }

      return [
        {
          id: discount.id,
          label: discount.code?.trim() || discount.name.trim() || null,
          amount: {
            amount,
            currencyCode: cart.currencyCode,
          },
          source: 'discount',
          fallback:
            discount.code?.trim() || discount.name.trim() ? null : 'discount',
        },
      ]
    })

  if (!cart.discountTotal) {
    return breakdown
  }

  const discountTotal = roundMoneyAmount(cart.discountTotal.amount)
  const itemizedTotal = roundMoneyAmount(
    breakdown.reduce((total, item) => total + item.amount.amount, 0),
  )
  const remainder = roundMoneyAmount(discountTotal - itemizedTotal)

  if (!hasMeaningfulAmount(remainder)) {
    return breakdown
  }

  const shippingDiscountTotal = cart.shippingDiscountTotal
    ? roundMoneyAmount(cart.shippingDiscountTotal.amount)
    : null
  const isShippingRemainder =
    shippingDiscountTotal !== null &&
    hasMeaningfulAmount(shippingDiscountTotal) &&
    Math.abs(remainder - shippingDiscountTotal) < epsilon

  breakdown.push({
    id: isShippingRemainder ? 'shipping-discount' : 'additional-discount',
    label: null,
    amount: {
      amount: remainder,
      currencyCode: cart.currencyCode,
    },
    source: isShippingRemainder ? 'shipping' : 'other',
    fallback: isShippingRemainder ? 'free_shipping' : 'additional_discount',
  })

  return breakdown
}
