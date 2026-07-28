export type OrderSummary = {
  completedAt: string
  displayTotal: string
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
  displayPrice: string
  displayTotal: string
  id: string
  imageUrl: string | null
  name: string
  optionsText: string
  quantity: number
  slug: string
  variantId: string
}

export type OrderFulfillment = {
  displayCost: string
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
  displayAmount: string
  id: string
  methodName: string | null
  number: string
  responseCode: string | null
  sourceLabel: string | null
  status: string
}

export type OrderDetail = OrderSummary & {
  amountDue: string
  billingAddress: OrderAddress | null
  customerNote: string | null
  discountTotal: string
  displayAmountDue: string
  displayDeliveryTotal: string
  displayDiscountTotal: string
  displayGiftCardTotal: string
  displayItemTotal: string
  displayStoreCreditTotal: string
  displayTaxTotal: string
  fulfillments: Array<OrderFulfillment>
  giftCardTotal: string
  items: Array<OrderLineItem>
  payments: Array<OrderPayment>
  shippingAddress: OrderAddress | null
  storeCreditTotal: string
  taxTotal: string
}
