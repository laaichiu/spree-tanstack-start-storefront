import type { CheckoutPaymentMethod } from '../../model/checkout'

export type CheckoutPaymentBlockReason =
  | 'payment_amount_unavailable'
  | 'payment_busy'
  | 'payment_form_incomplete'
  | 'payment_form_loading'
  | 'payment_method_missing'
  | 'payment_session_missing'
  | 'stripe_not_configured'
  | 'unsupported_session_payment'

export type CheckoutSubmitBlockReason =
  | 'checkout_pending'
  | 'checkout_submitting'
  | 'payment_busy'
  | 'payment_submit_queued'

export type CheckoutPaymentReadiness = {
  ready: boolean
  reason: CheckoutPaymentBlockReason | null
}

export type CheckoutSubmitReadiness = {
  ready: boolean
  reason: CheckoutSubmitBlockReason | null
}

export function getCheckoutPaymentReadiness({
  clientSecretAvailable,
  isBusy,
  orderTotalAmount,
  paymentSessionAvailable,
  savedPaymentMethodAvailable = false,
  selectedPaymentMethod,
  stripeConfigured,
  stripeElementComplete,
  stripeElementReady,
}: {
  clientSecretAvailable: boolean
  isBusy: boolean
  orderTotalAmount: number | null
  paymentSessionAvailable: boolean
  savedPaymentMethodAvailable?: boolean
  selectedPaymentMethod: CheckoutPaymentMethod | null
  stripeConfigured: boolean
  stripeElementComplete: boolean
  stripeElementReady: boolean
}): CheckoutPaymentReadiness {
  if (isBusy) {
    return {
      ready: false,
      reason: 'payment_busy',
    }
  }

  if (orderTotalAmount === null) {
    return {
      ready: false,
      reason: 'payment_amount_unavailable',
    }
  }

  if (orderTotalAmount <= 0) {
    return {
      ready: true,
      reason: null,
    }
  }

  if (!selectedPaymentMethod) {
    return {
      ready: false,
      reason: 'payment_method_missing',
    }
  }

  if (!selectedPaymentMethod.sessionRequired) {
    return {
      ready: true,
      reason: null,
    }
  }

  if (selectedPaymentMethod.gatewayId !== 'stripe') {
    return {
      ready: false,
      reason: 'unsupported_session_payment',
    }
  }

  if (!stripeConfigured) {
    return {
      ready: false,
      reason: 'stripe_not_configured',
    }
  }

  if (!paymentSessionAvailable || !clientSecretAvailable) {
    return {
      ready: false,
      reason: 'payment_session_missing',
    }
  }

  if (savedPaymentMethodAvailable) {
    return {
      ready: true,
      reason: null,
    }
  }

  if (!stripeElementReady) {
    return {
      ready: false,
      reason: 'payment_form_loading',
    }
  }

  if (!stripeElementComplete) {
    return {
      ready: false,
      reason: 'payment_form_incomplete',
    }
  }

  return {
    ready: true,
    reason: null,
  }
}

export function getCheckoutSubmitReadiness({
  isCheckoutPending,
  isCheckoutSubmitting,
  isPaymentBusy,
  isPaymentSubmitQueued,
}: {
  isCheckoutPending: boolean
  isCheckoutSubmitting: boolean
  isPaymentBusy: boolean
  isPaymentSubmitQueued: boolean
}): CheckoutSubmitReadiness {
  if (isCheckoutSubmitting) {
    return {
      ready: false,
      reason: 'checkout_submitting',
    }
  }

  if (isCheckoutPending) {
    return {
      ready: false,
      reason: 'checkout_pending',
    }
  }

  if (isPaymentBusy) {
    return {
      ready: false,
      reason: 'payment_busy',
    }
  }

  if (isPaymentSubmitQueued) {
    return {
      ready: false,
      reason: 'payment_submit_queued',
    }
  }

  return {
    ready: true,
    reason: null,
  }
}
