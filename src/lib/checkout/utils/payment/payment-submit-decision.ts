import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

export type CheckoutPaymentSubmitDecision =
  | CheckoutPaymentMethod
  | 'checkout.paymentSessionNotReady'
  | 'checkout.selectShippingBeforePayment'
  | 'checkout.selectPaymentMethod'
  | 'complete'

export function getCheckoutPaymentSubmitDecision(
  amountDue: number | null,
  paymentMethod: CheckoutPaymentMethod | null,
  shippingReady: boolean,
): CheckoutPaymentSubmitDecision {
  if (amountDue === null) {
    return 'checkout.paymentSessionNotReady'
  }

  if (!shippingReady) {
    return 'checkout.selectShippingBeforePayment'
  }

  if (amountDue <= 0) {
    return 'complete'
  }

  if (!paymentMethod) {
    return 'checkout.selectPaymentMethod'
  }

  return paymentMethod
}
