import { formatCountryName } from '@/lib/core/market'
import { formatSpreeMoney } from '@/lib/runtime/spree-money'
import type { MoneyDisplayContext } from '@/lib/runtime/spree-money'
import type { Address, Fulfillment, Order, Payment } from '@spree/sdk'

import type {
  OrderAddress,
  OrderDetail,
  OrderFulfillment,
  OrderPayment,
  OrderSummary,
} from '@/lib/account/contracts'

export function mapSpreeOrderToSummary(
  order: Order,
  locale: string,
): OrderSummary {
  return {
    completedAt: order.completed_at ?? '',
    displayTotal: formatSpreeMoney(order.total, {
      currencyCode: order.currency,
      locale,
    }),
    fulfillmentStatus: order.fulfillment_status,
    id: order.id,
    number: order.number,
    paymentStatus: order.payment_status,
    totalQuantity: order.total_quantity,
  }
}

export function mapSpreeOrdersToSummaries(
  orders: Array<Order>,
  locale: string,
): Array<OrderSummary> {
  return orders
    .filter((order) => Boolean(order.completed_at))
    .map((order) => mapSpreeOrderToSummary(order, locale))
}

function mapAddress(
  address: Address | null,
  locale: string,
): OrderAddress | null {
  if (!address) {
    return null
  }

  return {
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    company: address.company,
    countryName: formatCountryName(address.country_code, locale),
    fullName: address.full_name,
    phone: address.phone,
    postalCode: address.postal_code,
    stateText: address.state_text,
  }
}

function getFulfillmentItemQuantity(fulfillment: Fulfillment) {
  return fulfillment.items.reduce((total, item) => total + item.quantity, 0)
}

function getFulfillmentOriginLabel(fulfillment: Fulfillment, locale: string) {
  const location = fulfillment.stock_location

  return [
    location.name,
    [location.city, location.state_text || location.state_code]
      .filter(Boolean)
      .join(', '),
    location.country_code
      ? formatCountryName(location.country_code, locale)
      : null,
  ]
    .filter(Boolean)
    .join(' / ')
}

function mapFulfillment(
  fulfillment: Fulfillment,
  context: MoneyDisplayContext,
): OrderFulfillment {
  return {
    displayCost: formatSpreeMoney(fulfillment.cost, context),
    fulfilledAt: fulfillment.fulfilled_at,
    id: fulfillment.id,
    itemQuantity: getFulfillmentItemQuantity(fulfillment),
    methodName: fulfillment.delivery_method.name,
    number: fulfillment.number,
    originLabel: getFulfillmentOriginLabel(fulfillment, context.locale),
    status: fulfillment.status,
    tracking: fulfillment.tracking,
    trackingUrl: fulfillment.tracking_url,
  }
}

function getPaymentSourceLabel(payment: Payment) {
  if (payment.source && 'last4' in payment.source) {
    return `${payment.payment_method.name} ending in ${payment.source.last4}`
  }

  if (payment.source && 'amount_remaining' in payment.source) {
    return 'Store credit'
  }

  return payment.source_type
}

function mapPayment(
  payment: Payment,
  context: MoneyDisplayContext,
): OrderPayment {
  return {
    displayAmount: formatSpreeMoney(payment.amount, context),
    id: payment.id,
    methodName: payment.payment_method.name,
    number: payment.number,
    responseCode: payment.response_code,
    sourceLabel: getPaymentSourceLabel(payment),
    status: payment.status,
  }
}

export function mapSpreeOrderToDetail(
  order: Order,
  locale: string,
): OrderDetail {
  const context = { currencyCode: order.currency, locale }
  return {
    ...mapSpreeOrderToSummary(order, locale),
    amountDue: order.amount_due,
    billingAddress: mapAddress(order.billing_address, locale),
    customerNote: order.customer_note,
    discountTotal: order.discount_total,
    displayAmountDue: formatSpreeMoney(order.amount_due, context),
    displayDeliveryTotal: formatSpreeMoney(order.delivery_total, context),
    displayDiscountTotal: formatSpreeMoney(order.discount_total, context),
    displayGiftCardTotal: formatSpreeMoney(order.gift_card_total, context),
    displayItemTotal: formatSpreeMoney(order.item_total, context),
    displayStoreCreditTotal: formatSpreeMoney(
      order.store_credit_total,
      context,
    ),
    displayTaxTotal: formatSpreeMoney(order.tax_total, context),
    fulfillments: order.fulfillments.map((fulfillment) =>
      mapFulfillment(fulfillment, context),
    ),
    giftCardTotal: order.gift_card_total,
    items: order.items.map((item) => ({
      displayPrice: formatSpreeMoney(item.price, context, { unitPrice: true }),
      displayTotal: formatSpreeMoney(item.total, context),
      id: item.id,
      imageUrl: item.thumbnail_url,
      name: item.name,
      optionsText: item.options_text,
      quantity: item.quantity,
      slug: item.slug,
      variantId: item.variant_id,
    })),
    payments: order.payments
      .filter((payment) => payment.status !== 'void')
      .map((payment) => mapPayment(payment, context)),
    shippingAddress: mapAddress(order.shipping_address, locale),
    storeCreditTotal: order.store_credit_total,
    taxTotal: order.tax_total,
  }
}
