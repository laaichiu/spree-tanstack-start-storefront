export type OrderSummary = {
  completedAt: string
  displayTotal: string | null
  fulfillmentStatus: string | null
  id: string
  number: string
  paymentStatus: string | null
  totalQuantity: number
}

export type OrderAddress = {
  address1: string | null
  address2: string | null
  city: string | null
  company: string | null
  countryName: string
  fullName: string
  phone: string | null
  postalCode: string | null
  stateText: string | null
}

export type OrderLineItem = {
  displayPrice: string | null
  displayTotal: string | null
  id: string
  imageUrl: string | null
  name: string
  optionsText: string
  quantity: number
  slug: string
  variantId: string
}

export type OrderFulfillment = {
  displayCost: string | null
  fulfilledAt: string | null
  id: string
  itemQuantity: number
  methodName: string | null
  number: string
  originLabel: string | null
  status: string
  tracking: string | null
  trackingUrl: string | null
}

export type OrderPayment = {
  displayAmount: string | null
  id: string
  methodName: string | null
  number: string
  responseCode: string | null
  sourceLabel: string | null
  status: string
}

export type OrderDetail = OrderSummary & {
  amountDue: string | null
  billingAddress: OrderAddress | null
  customerNote: string | null
  discountTotal: string | null
  displayAmountDue: string | null
  displayDeliveryTotal: string | null
  displayDiscountTotal: string | null
  displayGiftCardTotal: string | null
  displayItemTotal: string | null
  displayStoreCreditTotal: string | null
  displayTaxTotal: string | null
  fulfillments: Array<OrderFulfillment>
  giftCardTotal: string | null
  items: Array<OrderLineItem>
  payments: Array<OrderPayment>
  shippingAddress: OrderAddress | null
  storeCreditTotal: string | null
  taxTotal: string | null
}
