import { readSafePaymentSessionErrorMessage } from './payment-session'
import { stripePromise } from '../../../stripe/client'
import type { CheckoutPaymentElementResult } from './payment-provider-confirmation'

export async function confirmStripeSavedCardPayment({
  clientSecret,
  confirmPaymentFallbackMessage,
  paymentMethodId,
  returnUrl,
  stripeNotLoadedMessage,
}: {
  clientSecret: string
  confirmPaymentFallbackMessage: string
  paymentMethodId: string
  returnUrl: string
  stripeNotLoadedMessage: string
}): Promise<CheckoutPaymentElementResult> {
  const stripe = await stripePromise

  if (!stripe) {
    return { error: stripeNotLoadedMessage }
  }

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethodId,
    return_url: returnUrl,
  })

  if (result.error) {
    return {
      error: readSafePaymentSessionErrorMessage(
        result.error.message,
        confirmPaymentFallbackMessage,
      ),
    }
  }

  return {}
}
