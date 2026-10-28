import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import { isStripeExpressCheckoutCurrencySupported } from './express-checkout-currency'

export type CheckoutExpressCheckoutState =
  | {
      reason: 'no_payment_due'
      status: 'hidden'
    }
  | {
      reason:
        | 'stripe_not_configured'
        | 'stripe_payment_method_missing'
        | 'currency_unsupported'
        | 'wallet_action_missing'
      status: 'disabled'
    }
  | {
      reason: null
      status: 'ready'
    }

export function getCheckoutExpressCheckoutState({
  amountDue,
  currencyCode,
  hasWalletAction,
  paymentMethods,
  stripeConfigured,
}: {
  amountDue: number | null
  currencyCode: string
  hasWalletAction: boolean
  paymentMethods: CheckoutPaymentMethod[]
  stripeConfigured: boolean
}): CheckoutExpressCheckoutState {
  if (amountDue === null) {
    return {
      reason: 'wallet_action_missing',
      status: 'disabled',
    }
  }

  if (amountDue <= 0) {
    return {
      reason: 'no_payment_due',
      status: 'hidden',
    }
  }

  if (!isStripeExpressCheckoutCurrencySupported(currencyCode)) {
    return {
      reason: 'currency_unsupported',
      status: 'disabled',
    }
  }

  if (!stripeConfigured) {
    return {
      reason: 'stripe_not_configured',
      status: 'disabled',
    }
  }

  const hasStripeSessionPaymentMethod = paymentMethods.some(
    (method) => method.gatewayId === 'stripe' && method.sessionRequired,
  )

  if (!hasStripeSessionPaymentMethod) {
    return {
      reason: 'stripe_payment_method_missing',
      status: 'disabled',
    }
  }

  if (!hasWalletAction) {
    return {
      reason: 'wallet_action_missing',
      status: 'disabled',
    }
  }

  return {
    reason: null,
    status: 'ready',
  }
}
