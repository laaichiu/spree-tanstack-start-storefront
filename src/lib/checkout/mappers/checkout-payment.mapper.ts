import { formatSpreeMoney } from '@/lib/runtime/spree-money'
import type { MoneyDisplayContext } from '@/lib/runtime/spree-money'
import type {
  Cart as SpreeCart,
  Payment as SpreePayment,
  PaymentSession as SpreePaymentSession,
} from '@spree/sdk'

import type {
  CheckoutGatewayId,
  CheckoutPayment,
  CheckoutPaymentMethod,
  CheckoutRequirement,
} from '@/lib/checkout/contracts'
import type { CheckoutPaymentSession as CheckoutPaymentSessionModel } from '../utils/payment/payment-session-contract'
import { readCheckoutText } from './checkout-text.mapper'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mapSpreeCheckoutPaymentMethod(
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

export function mapSpreeCheckoutRequirement(
  requirement: SpreeCart['requirements'][number],
): CheckoutRequirement {
  return {
    field: requirement.field,
    message: requirement.message,
    step: requirement.step,
  }
}

function getPaymentSourceLabel(payment: SpreePayment) {
  if (payment.source && 'last4' in payment.source) {
    return `${payment.payment_method.name} ending in ${payment.source.last4}`
  }

  if (payment.source && 'amount_remaining' in payment.source) {
    return 'Store credit'
  }

  return payment.source_type === 'store_credit' ? 'Store credit' : null
}

export function mapSpreeCheckoutPayment(
  payment: SpreePayment,
  context: MoneyDisplayContext,
): CheckoutPayment {
  return {
    displayAmount: formatSpreeMoney(payment.amount, context),
    id: payment.id,
    methodName: payment.payment_method.name,
    number: readCheckoutText(payment.number),
    responseCode: readCheckoutText(payment.response_code),
    sourceLabel: getPaymentSourceLabel(payment),
    status: readCheckoutText(payment.status),
  }
}

export function isVisibleCompletedCheckoutPayment(payment: SpreePayment) {
  return payment.status !== 'void' && payment.status !== 'invalid'
}

function readProviderDataString(rawExternalData: unknown, key: string) {
  if (!isRecord(rawExternalData)) {
    return null
  }

  const value = rawExternalData[key]

  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function mapSpreePaymentSession(
  session: Pick<SpreePaymentSession, 'id' | 'status'> & {
    external_data?: unknown
  },
): CheckoutPaymentSessionModel {
  return {
    providerData: {
      clientSecret: readProviderDataString(
        session.external_data,
        'client_secret',
      ),
    },
    id: session.id,
    status: session.status,
  }
}
