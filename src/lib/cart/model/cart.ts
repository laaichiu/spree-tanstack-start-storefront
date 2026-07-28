import type { Money } from '@/lib/money/money'

export type CartLineItem = {
  id: string
  variantId: string
  productSlug: string
  name: string
  optionsText: string
  optionValues: CartLineItemOptionValue[]
  quantity: number
  imageUrl: string | null
  unitPrice: Money
  totalPrice: Money
}

export type CartLineItemOptionValue = {
  id: string
  label: string
  name: string
  optionTypeId: string
  optionTypeLabel: string
  optionTypeName: string
  position: number
  colorCode: string | null
}

export type CartShippingRate = {
  deliveryMethodId: string
  id: string
  fulfillmentId: string
  name: string
  selected: boolean
  displayPrice: Money
  price: Money
}

export type CartAppliedDiscount = {
  id: string
  promotionId: string
  name: string
  description: string | null
  code: string | null
  amount: Money
}

export type CartAppliedGiftCard = {
  id: string
  code: string
  status: string
  appliedAmount: Money
  amountRemaining: Money
  expiresAt: string | null
  expired: boolean
  active: boolean
}

export type CartFreeShippingPromotion = {
  comparison: 'greaterThan'
  threshold: Money
}

export type CartSummary = {
  id: string
  itemCount: number
  currencyCode: string
  currentStep: string | null
  completedSteps: string[]
  items: CartLineItem[]
  shippingRates: CartShippingRate[]
  appliedDiscounts: CartAppliedDiscount[]
  appliedGiftCard: CartAppliedGiftCard | null
  itemTotal: Money
  discountTotal: Money
  deliveryTotal: Money
  shippingDiscountTotal: Money
  taxTotal: Money
  total: Money
}
