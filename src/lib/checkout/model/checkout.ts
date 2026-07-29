import type { CartSummary } from '@/lib/cart/model/cart'
import type { Money } from '@/lib/money/money'

export type CheckoutJsonValue =
  | boolean
  | null
  | number
  | string
  | CheckoutJsonValue[]
  | { [key: string]: CheckoutJsonValue }

export type CheckoutGatewayId =
  | 'adyen'
  | 'paypal'
  | 'razorpay'
  | 'stripe'
  | 'unknown'

export type CheckoutPaymentMethod = {
  description: string | null
  gatewayId: CheckoutGatewayId
  id: string
  name: string
  sessionRequired: boolean
  type: string
}

export type CheckoutPaymentSession = {
  amount: Money
  currencyCode: string
  customerExternalId: string | null
  expiresAt: string | null
  externalData: Record<string, CheckoutJsonValue>
  externalId: string | null
  id: string
  orderId: string
  paymentMethodId: string
  status: string
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
  shippingAddress: CheckoutAddress | null
  shippingMatchesBillingAddress: boolean
}

export type CheckoutCompletionErrorCode =
  | 'order_complete_failed'
  | 'payment_confirmation_failed'
  | 'payment_failed'
  | 'payment_session_not_ready'
  | 'payment_submit_failed'

export type CheckoutCompletionResult =
  | {
      order: CheckoutOrder | null
      success: true
    }
  | {
      error: string
      errorCode?: CheckoutCompletionErrorCode
      order?: CheckoutOrder | null
      success: false
    }
