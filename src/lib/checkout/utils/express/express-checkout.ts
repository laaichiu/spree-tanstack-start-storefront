import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { Money } from '@/lib/money/money'

const STRIPE_ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
])

export type ExpressCheckoutLineItem = {
  amount: number
  name: string
}

export type ExpressCheckoutRateSelection = {
  fulfillmentId: string
  rateId: string
}

export type ExpressCheckoutStripeAddress = {
  city: string
  country: string
  line1: string
  line2: string | null
  postal_code: string
  state: string | null
}

export type ExpressCheckoutAddressParams = {
  address1: string
  address2?: string
  city: string
  country_iso: string
  first_name: string
  last_name: string
  phone?: string
  postal_code: string
  quick_checkout: true
  state_abbr?: string
  state_name?: string
}

export function toStripeMinorUnit(money: Money) {
  if (!Number.isFinite(money.amount)) {
    throw new TypeError(
      `Expected a finite money amount, received ${String(money.amount)}`,
    )
  }

  if (STRIPE_ZERO_DECIMAL_CURRENCIES.has(money.currencyCode.toLowerCase())) {
    return Math.round(money.amount)
  }

  return Math.round(money.amount * 100)
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
  const lineItems: ExpressCheckoutLineItem[] = [
    {
      amount: toStripeMinorUnit(order.itemTotal),
      name: subtotalLabel,
    },
  ]
  const discountAmount = toStripeMinorUnit(order.discountTotal)

  if (discountAmount < 0) {
    lineItems.push({
      amount: discountAmount,
      name: discountLabel,
    })
  }

  const taxAmount = toStripeMinorUnit(order.taxTotal)

  if (taxAmount > 0) {
    lineItems.push({
      amount: taxAmount,
      name: taxLabel,
    })
  }

  const amountDueBaseline = getLineItemsAmount(lineItems)

  if (typeof shippingAmount === 'number') {
    lineItems.push({
      amount: shippingAmount,
      name: shippingLabel,
    })
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
  if (order.amountDue.currencyCode !== order.currencyCode) {
    return null
  }

  return toStripeMinorUnit(order.amountDue)
}

export function getExpressCheckoutSelectedShippingAmount(order: CheckoutOrder) {
  if (!order.shippingRates.some((rate) => rate.selected)) {
    return null
  }

  return toStripeMinorUnit(order.deliveryTotal)
}

export function getExpressCheckoutAmount(order: CheckoutOrder) {
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

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

export function buildExpressCheckoutShippingRateMap({
  isGooglePay,
  rates,
}: {
  isGooglePay: boolean
  rates: CartShippingRate[]
}) {
  const rateMap = new Map<
    string,
    { amount: number; displayName: string; id: string }
  >()
  const selectionMap = new Map<string, ExpressCheckoutRateSelection[]>()

  for (const rate of rates) {
    const groupId = rate.deliveryMethodId || rate.id
    const existingRate = rateMap.get(groupId)

    if (!existingRate) {
      const stripeRateId = isGooglePay
        ? `${groupId}-${randomSuffix()}`
        : groupId

      rateMap.set(groupId, {
        amount: toStripeMinorUnit(rate.price),
        displayName: rate.name,
        id: stripeRateId,
      })
      selectionMap.set(stripeRateId, [
        {
          fulfillmentId: rate.fulfillmentId,
          rateId: rate.id,
        },
      ])
      continue
    }

    existingRate.amount += toStripeMinorUnit(rate.price)
    selectionMap.get(existingRate.id)?.push({
      fulfillmentId: rate.fulfillmentId,
      rateId: rate.id,
    })
  }

  return {
    selectionMap,
    shippingRates: Array.from(rateMap.values()),
  }
}

export function getLineItemsAmount(lineItems: ExpressCheckoutLineItem[]) {
  return lineItems.reduce((total, item) => total + item.amount, 0)
}

export function parseExpressCheckoutName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? '',
      lastName: '',
    }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  }
}

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function buildExpressCheckoutAddressParams({
  address,
  name,
  phone,
}: {
  address: ExpressCheckoutStripeAddress
  name: {
    firstName: string
    lastName: string
  }
  phone?: string | null
}): ExpressCheckoutAddressParams {
  return {
    address1: address.line1,
    address2: optionalAddressText(address.line2),
    city: address.city,
    country_iso: address.country.toUpperCase(),
    first_name: name.firstName || 'Express',
    last_name: name.lastName || 'Checkout',
    phone: optionalAddressText(phone),
    postal_code: address.postal_code,
    quick_checkout: true,
    state_name: optionalAddressText(address.state),
  }
}
