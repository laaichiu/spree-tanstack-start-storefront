import type {
  Address as SpreeAddress,
  Cart as SpreeCart,
  Fulfillment as SpreeFulfillment,
  Order as SpreeOrder,
  Payment as SpreePayment,
  PaymentSession as SpreePaymentSession,
} from '@spree/sdk'

import { mapSpreeCartToSummary } from '@/lib/cart/mappers/cart.mapper'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'

import type {
  CheckoutAddress,
  CheckoutFulfillment,
  CheckoutGatewayId,
  CheckoutJsonValue,
  CheckoutOrder,
  CheckoutPayment,
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
  CheckoutRequirement,
} from '../model/checkout'

const GATEWAY_TYPE_MAP: Record<string, CheckoutGatewayId> = {
  'Spree::Gateway::AdyenGateway': 'adyen',
  'Spree::Gateway::PayPalExpress': 'paypal',
  'Spree::Gateway::RazorpayGateway': 'razorpay',
  'Spree::Gateway::StripeGateway': 'stripe',
  'SpreeAdyen::Gateway': 'adyen',
  'SpreePaypalCheckout::Gateway': 'paypal',
  'SpreeRazorpayCheckout::Gateway': 'razorpay',
  'SpreeStripe::Gateway': 'stripe',
  adyen: 'adyen',
  paypal: 'paypal',
  paypal_checkout: 'paypal',
  razorpay: 'razorpay',
  razorpay_checkout: 'razorpay',
  stripe: 'stripe',
}

function resolveGatewayId(paymentMethodType: string): CheckoutGatewayId {
  return GATEWAY_TYPE_MAP[paymentMethodType] ?? 'unknown'
}

function hasCheckoutFields(order: SpreeCart | SpreeOrder): order is SpreeCart {
  return 'payment_methods' in order && 'requirements' in order
}

function mapPaymentMethod(
  paymentMethod: SpreeCart['payment_methods'][number],
): CheckoutPaymentMethod {
  return {
    description: paymentMethod.description,
    gatewayId: resolveGatewayId(paymentMethod.type),
    id: paymentMethod.id,
    name: paymentMethod.name,
    sessionRequired: paymentMethod.session_required,
    type: paymentMethod.type,
  }
}

function mapRequirement(
  requirement: SpreeCart['requirements'][number],
): CheckoutRequirement {
  return {
    field: requirement.field,
    message: requirement.message,
    step: requirement.step,
  }
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim() ?? ''

  return normalized || null
}

function readNullableText(value: unknown): string | null {
  return typeof value === 'string' ? normalizeNullableText(value) : null
}

function readOrderTextField<T extends string>(
  order: SpreeCart | SpreeOrder,
  field: T,
): string | null {
  return readNullableText((order as Partial<Record<T, unknown>>)[field])
}

function mapAddress(address: SpreeAddress | null): CheckoutAddress | null {
  if (!address) {
    return null
  }

  return {
    address1: normalizeNullableText(address.address1),
    address2: normalizeNullableText(address.address2),
    city: normalizeNullableText(address.city),
    company: normalizeNullableText(address.company),
    countryIso: address.country_iso,
    countryName: address.country_name,
    firstName: normalizeNullableText(address.first_name),
    fullName: address.full_name,
    id: address.id,
    lastName: normalizeNullableText(address.last_name),
    phone: normalizeNullableText(address.phone),
    postalCode: normalizeNullableText(address.postal_code),
    stateAbbr: normalizeNullableText(address.state_abbr),
    stateName: normalizeNullableText(address.state_name),
    stateText: normalizeNullableText(address.state_text),
  }
}

function getFulfillmentItemQuantity(fulfillment: SpreeFulfillment) {
  return fulfillment.items.reduce((total, item) => total + item.quantity, 0)
}

function mapFulfillment(fulfillment: SpreeFulfillment): CheckoutFulfillment {
  return {
    displayCost: fulfillment.display_cost,
    fulfilledAt: fulfillment.fulfilled_at,
    id: fulfillment.id,
    itemQuantity: getFulfillmentItemQuantity(fulfillment),
    methodName: fulfillment.delivery_method.name,
    number: readNullableText(fulfillment.number),
    status: readNullableText(fulfillment.status),
    tracking: readNullableText(fulfillment.tracking),
    trackingUrl: readNullableText(fulfillment.tracking_url),
  }
}

function getPaymentSourceLabel(payment: SpreePayment) {
  if (payment.source && 'last4' in payment.source) {
    return `${payment.payment_method.name} ending in ${payment.source.last4}`
  }

  if (payment.source && 'display_amount_remaining' in payment.source) {
    return 'Store credit'
  }

  return payment.source_type === 'store_credit' ? 'Store credit' : null
}

function mapPayment(payment: SpreePayment): CheckoutPayment {
  return {
    displayAmount: payment.display_amount,
    id: payment.id,
    methodName: payment.payment_method.name,
    number: readNullableText(payment.number),
    responseCode: readNullableText(payment.response_code),
    sourceLabel: getPaymentSourceLabel(payment),
    status: readNullableText(payment.status),
  }
}

function isVisibleCompletedPayment(payment: SpreePayment) {
  return payment.status !== 'void' && payment.status !== 'invalid'
}

function toCheckoutJsonValue(value: unknown): CheckoutJsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCheckoutJsonValue(item))
  }

  if (typeof value === 'object') {
    const normalized: Record<string, CheckoutJsonValue> = {}

    for (const [key, fieldValue] of Object.entries(value)) {
      normalized[key] = toCheckoutJsonValue(fieldValue)
    }

    return normalized
  }

  return String(value)
}

function toCheckoutJsonRecord(
  value: Record<string, unknown>,
): Record<string, CheckoutJsonValue> {
  const normalized: Record<string, CheckoutJsonValue> = {}

  for (const [key, fieldValue] of Object.entries(value)) {
    normalized[key] = toCheckoutJsonValue(fieldValue)
  }

  return normalized
}

export function mapSpreeCheckoutToOrder(
  order: SpreeCart | SpreeOrder,
): CheckoutOrder {
  const hasCheckoutOrderFields = hasCheckoutFields(order)
  const payments = order.payments.filter(isVisibleCompletedPayment)
  const firstFulfillment = order.fulfillments.at(0)
  const firstPayment = payments.at(0)

  return {
    ...mapSpreeCartToSummary(order),
    amountDue: mapSpreeAmountToMoney(order.amount_due, order.currency),
    billingAddress: mapAddress(order.billing_address),
    completedAt: readOrderTextField(order, 'completed_at'),
    email: order.email,
    fulfillmentStatus:
      readOrderTextField(order, 'fulfillment_status') ??
      firstFulfillment?.status ??
      null,
    fulfillments: order.fulfillments.map(mapFulfillment),
    number: readNullableText(order.number) ?? order.id,
    payments: payments.map(mapPayment),
    paymentStatus:
      readOrderTextField(order, 'payment_status') ??
      firstPayment?.status ??
      null,
    paymentMethods: hasCheckoutOrderFields
      ? order.payment_methods.map(mapPaymentMethod)
      : [],
    requirements: hasCheckoutOrderFields
      ? order.requirements.map(mapRequirement)
      : [],
    shippingAddress: mapAddress(order.shipping_address),
    shippingMatchesBillingAddress: hasCheckoutOrderFields
      ? order.shipping_eq_billing_address
      : false,
  }
}

export function mapSpreePaymentSession(
  session: SpreePaymentSession,
): CheckoutPaymentSession {
  return {
    amount: mapSpreeAmountToMoney(session.amount, session.currency),
    currencyCode: session.currency,
    customerExternalId: session.customer_external_id,
    expiresAt: session.expires_at,
    externalData: toCheckoutJsonRecord(session.external_data),
    externalId: session.external_id || null,
    id: session.id,
    orderId: session.order_id,
    paymentMethodId: session.payment_method_id,
    status: session.status,
  }
}
