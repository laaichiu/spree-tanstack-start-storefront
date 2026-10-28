import type {
  Cart as SpreeCart,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
} from '@spree/sdk'
import type { Money } from '@/lib/core/money'

import { mapSpreeCartToSummary } from '@/lib/cart/mappers/cart.mapper'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { assertSpreeCartProjectionResponse } from '@/lib/cart/mappers/cart-projection-response'
import { assertCheckoutOrderGroupResponse } from './checkout-order-group-response'

import { mapSpreeCheckoutAddress } from './checkout-address.mapper'
import { mapSpreeCheckoutFulfillment } from './checkout-fulfillment.mapper'
import {
  isVisibleCompletedCheckoutPayment,
  mapSpreeCheckoutPayment,
  mapSpreeCheckoutPaymentMethod,
  mapSpreeCheckoutRequirement,
} from './checkout-payment.mapper'
import { readCheckoutOrderTextField } from './checkout-text.mapper'

type CheckoutMapperOptions = {
  locale: string
  cartIdOverride?: string
}

type CheckoutOrderGroupOptions = {
  id: string
  number: string
  orders: SpreeOrder[]
  locale: string
  completedAt: string | null
  email: string | null
  fulfillmentStatus: string | null
  paymentStatus: string | null
  total: Money | null
  itemTotal: Money | null
  amountDue: Money | null
  deliveryTotal: Money | null
  discountTotal: Money | null
  taxTotal: Money | null
  payments: CheckoutOrder['payments']
  billingAddress: CheckoutOrder['billingAddress']
  shippingAddress: CheckoutOrder['shippingAddress']
}

function hasCheckoutFields(order: SpreeCart | SpreeOrder): order is SpreeCart {
  return 'payment_methods' in order && 'requirements' in order
}

export function mapSpreeCheckoutToOrder(
  order: SpreeCart | SpreeOrder,
  options: CheckoutMapperOptions,
): CheckoutOrder {
  assertSpreeCartProjectionResponse(order)

  const hasCheckoutOrderFields = hasCheckoutFields(order)
  const payments = order.payments.filter(isVisibleCompletedCheckoutPayment)
  const firstFulfillment = order.fulfillments.at(0)
  const firstPayment = payments.at(0)
  const checkoutId = options.cartIdOverride ?? order.id
  const orderResourceId =
    options.cartIdOverride && options.cartIdOverride !== order.id
      ? order.id
      : undefined

  return {
    ...mapSpreeCartToSummary(order),
    amountDue: mapSpreeAmountToMoney(order.amount_due, order.currency),
    billingAddress: mapSpreeCheckoutAddress(
      order.billing_address,
      options.locale,
    ),
    completedAt: readCheckoutOrderTextField(order, 'completed_at'),
    email: order.email,
    fulfillmentStatus:
      readCheckoutOrderTextField(order, 'fulfillment_status') ??
      firstFulfillment?.status ??
      null,
    fulfillments: order.fulfillments.map((fulfillment) =>
      mapSpreeCheckoutFulfillment(fulfillment, {
        currencyCode: order.currency,
        locale: options.locale,
      }),
    ),
    number: readCheckoutOrderTextField(order, 'number') ?? order.id,
    ...(orderResourceId ? { orderResourceId } : {}),
    payments: payments.map((payment) =>
      mapSpreeCheckoutPayment(payment, {
        currencyCode: order.currency,
        locale: options.locale,
      }),
    ),
    paymentStatus:
      readCheckoutOrderTextField(order, 'payment_status') ??
      firstPayment?.status ??
      null,
    paymentMethods: hasCheckoutOrderFields
      ? order.payment_methods.map(mapSpreeCheckoutPaymentMethod)
      : [],
    requirements: hasCheckoutOrderFields
      ? order.requirements.map(mapSpreeCheckoutRequirement)
      : [],
    shippingAddress: mapSpreeCheckoutAddress(
      order.shipping_address,
      options.locale,
    ),
    shippingMatchesBillingAddress: hasCheckoutOrderFields
      ? order.shipping_eq_billing_address
      : false,
    id: checkoutId,
  }
}

export function mapSpreeOrderGroupToCheckoutOrder(
  group: SpreeOrderGroup,
  options: CheckoutMapperOptions,
): CheckoutOrder {
  assertCheckoutOrderGroupResponse(group)
  return mapSpreeOrderGroupOrdersToCheckoutOrder({
    amountDue: mapSpreeAmountToMoney(group.amount_due, group.currency),
    billingAddress: mapSpreeCheckoutAddress(
      group.billing_address,
      options.locale,
    ),
    completedAt: group.completed_at,
    email: group.email,
    deliveryTotal: mapSpreeAmountToMoney(group.delivery_total, group.currency),
    discountTotal: mapSpreeAmountToMoney(group.discount_total, group.currency),
    fulfillmentStatus: group.fulfillment_status,
    id: group.id,
    itemTotal: mapSpreeAmountToMoney(group.item_total, group.currency),
    number: group.number,
    orders: group.orders,
    locale: options.locale,
    paymentStatus: group.payment_status,
    payments: group.payments
      .filter(isVisibleCompletedCheckoutPayment)
      .map((payment) =>
        mapSpreeCheckoutPayment(payment, {
          currencyCode: group.currency,
          locale: options.locale,
        }),
      ),
    shippingAddress: mapSpreeCheckoutAddress(
      group.shipping_address,
      options.locale,
    ),
    total: mapSpreeAmountToMoney(group.total, group.currency),
    taxTotal: mapSpreeAmountToMoney(group.tax_total, group.currency),
  })
}

function mapSpreeOrderGroupOrdersToCheckoutOrder({
  id,
  number,
  orders,
  locale,
  completedAt,
  email,
  fulfillmentStatus,
  paymentStatus,
  total,
  itemTotal,
  amountDue,
  deliveryTotal,
  discountTotal,
  taxTotal,
  payments,
  billingAddress,
  shippingAddress,
}: CheckoutOrderGroupOptions): CheckoutOrder {
  if (orders.length === 0) {
    throw new Error('The completed order group does not contain any orders.')
  }

  const mappedOrders = orders.map((order) =>
    mapSpreeCheckoutToOrder(order, { locale }),
  )
  const firstOrder = mappedOrders[0]
  const currencyCode = firstOrder.currencyCode

  if (mappedOrders.some((order) => order.currencyCode !== currencyCode)) {
    throw new Error('The completed order group contains mixed currencies.')
  }

  const couponCodes = Array.from(
    new Set(
      mappedOrders
        .map((order) => order.couponCode)
        .filter((code): code is string => Boolean(code)),
    ),
  )

  return {
    ...(couponCodes.length === 1 ? { couponCode: couponCodes[0] } : {}),
    id,
    itemCount: mappedOrders.reduce(
      (quantity, order) => quantity + order.itemCount,
      0,
    ),
    currencyCode,
    currentStep: null,
    completedSteps: [],
    items: mappedOrders.flatMap((order) => order.items),
    shippingRates: [],
    appliedDiscounts: mappedOrders.flatMap((order) => order.appliedDiscounts),
    appliedGiftCard: null,
    itemTotal,
    discountTotal,
    deliveryTotal,
    shippingDiscountTotal: sumCheckoutShippingDiscounts(
      mappedOrders,
      currencyCode,
    ),
    taxTotal,
    total,
    amountDue,
    billingAddress,
    completedAt,
    email,
    fulfillmentStatus,
    fulfillments: mappedOrders.flatMap((order) => order.fulfillments ?? []),
    number,
    payments,
    paymentStatus,
    paymentMethods: [],
    requirements: [],
    shippingAddress,
    shippingMatchesBillingAddress: mappedOrders.every(
      (order) => order.shippingMatchesBillingAddress,
    ),
  }
}

function sumCheckoutShippingDiscounts(
  orders: CheckoutOrder[],
  currencyCode: string,
): Money | null {
  const values = orders.map((order) => order.shippingDiscountTotal)

  if (values.some((value) => !value || value.currencyCode !== currencyCode)) {
    return null
  }

  return {
    amount: values.reduce((sum, value) => sum + (value?.amount ?? 0), 0),
    currencyCode,
  }
}

export { mapSpreePaymentSession } from './checkout-payment.mapper'
