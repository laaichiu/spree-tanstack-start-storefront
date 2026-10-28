import { readSafePaymentSessionErrorMessage } from './payment-session'

import { confirmStripeSavedCardPayment } from './stripe-payment-confirmation'

export type CheckoutPaymentElementResult = {
  displayError?: boolean
  error?: string
}

export type CheckoutPaymentElementHandle = {
  confirmPayment: (returnUrl: string) => Promise<CheckoutPaymentElementResult>
}

export type CheckoutPaymentProviderConfirmationResult =
  | { type: 'success' }
  | { displayError?: boolean; message: string; type: 'error' }
  | { type: 'unknown' }

export async function confirmCheckoutPaymentProvider({
  clientSecret,
  confirmPaymentFallbackMessage,
  paymentFormNotReadyMessage,
  returnUrl,
  savedPaymentProfileId,
  stripeNotLoadedMessage,
  stripePaymentHandle,
}: {
  clientSecret: string
  confirmPaymentFallbackMessage: string
  paymentFormNotReadyMessage: string
  returnUrl: string
  savedPaymentProfileId: string | null
  stripeNotLoadedMessage: string
  stripePaymentHandle: CheckoutPaymentElementHandle | null
}): Promise<CheckoutPaymentProviderConfirmationResult> {
  try {
    const confirmResult = savedPaymentProfileId
      ? await confirmStripeSavedCardPayment({
          clientSecret,
          confirmPaymentFallbackMessage,
          paymentMethodId: savedPaymentProfileId,
          returnUrl,
          stripeNotLoadedMessage,
        })
      : stripePaymentHandle
        ? await stripePaymentHandle.confirmPayment(returnUrl)
        : { error: paymentFormNotReadyMessage }

    if (confirmResult.error) {
      return {
        displayError: confirmResult.displayError,
        message: readSafePaymentSessionErrorMessage(
          confirmResult.error,
          confirmPaymentFallbackMessage,
        ),
        type: 'error',
      }
    }

    return { type: 'success' }
  } catch {
    return { type: 'unknown' }
  }
}
