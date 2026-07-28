import { stripePromise } from '@/lib/stripe/client'

import type { StripePaymentElementResult } from './stripe-payment-element.types'

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
}): Promise<StripePaymentElementResult> {
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
      error: result.error.message || confirmPaymentFallbackMessage,
    }
  }

  return {}
}
