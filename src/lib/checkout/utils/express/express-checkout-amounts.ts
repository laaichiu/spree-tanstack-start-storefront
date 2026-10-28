import type { CheckoutOrder } from '@/lib/checkout/contracts'

import {
  isStripeExpressCheckoutCurrencySupported,
  toStripeMinorUnit,
} from './express-checkout-currency'

export type ExpressCheckoutLineItem = {
  amount: number
  name: string
}

export function buildExpressCheckoutLineItems({
  amountDueShippingAmount = 0,
  checkoutCreditLabel = 'Gift card / store credit',
  discountLabel,
  order,
  shippingAmount,
  shippingLabel = 'Shipping',
  subtotalLabel,
  taxLabel,
}: {
  amountDueShippingAmount?: number
  checkoutCreditLabel?: string
  discountLabel: string
  order: CheckoutOrder
  shippingAmount?: number
  shippingLabel?: string
  subtotalLabel: string
  taxLabel: string
}): ExpressCheckoutLineItem[] {
  if (!order.itemTotal || !order.discountTotal || !order.taxTotal) {
    return []
  }

  const lineItems: ExpressCheckoutLineItem[] = [
    {
      amount: toStripeMinorUnit(order.itemTotal),
      name: subtotalLabel,
    },
  ]
  const discountAmount = toStripeMinorUnit(order.discountTotal)

  if (discountAmount < 0) {
    lineItems.push({ amount: discountAmount, name: discountLabel })
  }

  const taxAmount = toStripeMinorUnit(order.taxTotal)

  if (taxAmount > 0) {
    lineItems.push({ amount: taxAmount, name: taxLabel })
  }

  const amountDueBaseline = getLineItemsAmount(lineItems)

  if (typeof shippingAmount === 'number') {
    lineItems.push({ amount: shippingAmount, name: shippingLabel })
  }

  const amountDue = getExpressCheckoutAmountDue(order)
  const amountDueWithoutShipping =
    amountDue === null ? null : amountDue - amountDueShippingAmount

  if (
    amountDueWithoutShipping !== null &&
    amountDueWithoutShipping < amountDueBaseline
  ) {
    lineItems.push({
      amount: amountDueWithoutShipping - amountDueBaseline,
      name: checkoutCreditLabel,
    })
  }

  return lineItems
}

function getExpressCheckoutAmountDue(order: CheckoutOrder) {
  if (!order.amountDue || order.amountDue.currencyCode !== order.currencyCode) {
    return null
  }

  return toStripeMinorUnit(order.amountDue)
}

export function getExpressCheckoutSelectedShippingAmount(order: CheckoutOrder) {
  if (!order.shippingRates.some((rate) => rate.selected)) {
    return null
  }

  if (
    !order.deliveryTotal ||
    !isStripeExpressCheckoutCurrencySupported(order.deliveryTotal.currencyCode)
  ) {
    return null
  }

  return toStripeMinorUnit(order.deliveryTotal)
}

export function getExpressCheckoutAmount(order: CheckoutOrder) {
  if (
    !order.itemTotal ||
    !order.discountTotal ||
    !order.taxTotal ||
    !isStripeExpressCheckoutCurrencySupported(order.currencyCode)
  ) {
    return null
  }

  const shippingAmount = getExpressCheckoutSelectedShippingAmount(order)

  return buildExpressCheckoutLineItems({
    amountDueShippingAmount: shippingAmount ?? undefined,
    discountLabel: 'Discount',
    order,
    shippingAmount: shippingAmount ?? undefined,
    subtotalLabel: 'Subtotal',
    taxLabel: 'Tax',
  }).reduce((total, item) => total + item.amount, 0)
}

export function getLineItemsAmount(lineItems: ExpressCheckoutLineItem[]) {
  return lineItems.reduce((total, item) => total + item.amount, 0)
}
