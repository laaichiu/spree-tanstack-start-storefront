import type { CartSummary } from '../../cart/contracts'
import type { Money } from '@/lib/core/money'

export type CheckoutGatewayId =
  'adyen' | 'paypal' | 'razorpay' | 'stripe' | 'unknown'

export type CheckoutPaymentMethod = {
  description: string | null
  gatewayId: CheckoutGatewayId
  id: string
  name: string
  sessionRequired: boolean
  type: string
}

export type CheckoutRequirement = {
  field: string
  message: string
  step: string
}

export type CheckoutAddress = {
  address1: string | null
  address2: string | null
  city: string | null
  company: string | null
  countryIso: string
  countryName: string
  firstName: string | null
  fullName: string
  id: string
  lastName: string | null
  phone: string | null
  postalCode: string | null
  stateAbbr: string | null
  stateName: string | null
  stateText: string | null
}

export type CheckoutFulfillment = {
  displayCost: string | null
  fulfilledAt: string | null
  id: string
  itemQuantity: number
  methodName: string | null
  number: string | null
  status: string | null
  tracking: string | null
  trackingUrl: string | null
}

export type CheckoutPayment = {
  displayAmount: string | null
  id: string
  methodName: string | null
  number: string | null
  responseCode: string | null
  sourceLabel: string | null
  status: string | null
}

/**
 * Normalized checkout page data. Payment sessions and completion results stay
 * in the storefront runtime because they carry provider and trust-boundary
 * details that are not presentation contracts.
 */
export type CheckoutOrder = CartSummary & {
  amountDue: Money | null
  billingAddress: CheckoutAddress | null
  completedAt?: string | null
  email: string | null
  fulfillmentStatus?: string | null
  fulfillments?: CheckoutFulfillment[]
  number?: string | null
  payments?: CheckoutPayment[]
  paymentStatus?: string | null
  paymentMethods: CheckoutPaymentMethod[]
  requirements: CheckoutRequirement[]
  /**
   * The Spree Order resource id when a completed-order serializer is used as
   * a read-only projection for an active checkout handle. The inherited `id`
   * remains the checkout/cart owner in that path.
   */
  orderResourceId?: string | null
  shippingAddress: CheckoutAddress | null
  shippingMatchesBillingAddress: boolean
}
