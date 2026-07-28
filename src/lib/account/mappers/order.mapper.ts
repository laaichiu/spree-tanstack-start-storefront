import type { Address, Fulfillment, Order, Payment } from '@spree/sdk'

import type {
  OrderAddress,
  OrderDetail,
  OrderFulfillment,
  OrderPayment,
  OrderSummary,
} from '@/lib/account/model/order'

export function mapSpreeOrderToSummary(order: Order): OrderSummary {
  return {
    completedAt: order.completed_at ?? '',
    displayTotal: order.display_total,
    fulfillmentStatus: order.fulfillment_status,
    id: order.id,
    number: order.number,
    paymentStatus: order.payment_status,
    totalQuantity: order.total_quantity,
  }
}

export function mapSpreeOrdersToSummaries(
  orders: Array<Order>,
): Array<OrderSummary> {
  return orders
    .filter((order) => Boolean(order.completed_at))
    .map(mapSpreeOrderToSummary)
}

function mapAddress(address: Address | null): OrderAddress | null {
  if (!address) {
    return null
  }

  return {
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    company: address.company,
    countryName: address.country_name,
    fullName: address.full_name,
    phone: address.phone,
    postalCode: address.postal_code,
    stateText: address.state_text,
  }
}

function getFulfillmentItemQuantity(fulfillment: Fulfillment) {
  return fulfillment.items.reduce((total, item) => total + item.quantity, 0)
}

function getFulfillmentOriginLabel(fulfillment: Fulfillment) {
  const location = fulfillment.stock_location

  return [
    location.name,
    [location.city, location.state_text || location.state_abbr]
      .filter(Boolean)
      .join(', '),
    location.country_name,
  ]
    .filter(Boolean)
    .join(' / ')
}

function mapFulfillment(fulfillment: Fulfillment): OrderFulfillment {
  return {
    displayCost: fulfillment.display_cost,
    fulfilledAt: fulfillment.fulfilled_at,
    id: fulfillment.id,
    itemQuantity: getFulfillmentItemQuantity(fulfillment),
    methodName: fulfillment.delivery_method.name,
    number: fulfillment.number,
    originLabel: getFulfillmentOriginLabel(fulfillment),
    status: fulfillment.status,
    tracking: fulfillment.tracking,
    trackingUrl: fulfillment.tracking_url,
  }
}

function getPaymentSourceLabel(payment: Payment) {
  if (payment.source && 'last4' in payment.source) {
    return `${payment.payment_method.name} ending in ${payment.source.last4}`
  }

  if (payment.source && 'display_amount_remaining' in payment.source) {
    return 'Store credit'
  }

  return payment.source_type
}

function mapPayment(payment: Payment): OrderPayment {
  return {
    displayAmount: payment.display_amount,
    id: payment.id,
    methodName: payment.payment_method.name,
    number: payment.number,
    responseCode: payment.response_code,
    sourceLabel: getPaymentSourceLabel(payment),
    status: payment.status,
  }
}

export function mapSpreeOrderToDetail(order: Order): OrderDetail {
  return {
    ...mapSpreeOrderToSummary(order),
    amountDue: order.amount_due,
    billingAddress: mapAddress(order.billing_address),
    customerNote: order.customer_note,
    discountTotal: order.discount_total,
    displayAmountDue: order.display_amount_due,
    displayDeliveryTotal: order.display_delivery_total,
    displayDiscountTotal: order.display_discount_total,
    displayGiftCardTotal: order.display_gift_card_total,
    displayItemTotal: order.display_item_total,
    displayStoreCreditTotal: order.display_store_credit_total,
    displayTaxTotal: order.display_tax_total,
    fulfillments: order.fulfillments.map(mapFulfillment),
    giftCardTotal: order.gift_card_total,
    items: order.items.map((item) => ({
      displayPrice: item.display_price,
      displayTotal: item.display_total,
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
      .map(mapPayment),
    shippingAddress: mapAddress(order.shipping_address),
    storeCreditTotal: order.store_credit_total,
    taxTotal: order.tax_total,
  }
}
