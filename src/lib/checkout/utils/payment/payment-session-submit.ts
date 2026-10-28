import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MessageKey } from '../../../i18n/messages'

import {
  getCheckoutPaymentReturnUrl,
  isCompletedPaymentSessionStatus,
} from './payment-session'
import type { CheckoutPaymentSession } from './payment-session-contract'
import { confirmCheckoutPaymentProvider } from './payment-provider-confirmation'
import type { CheckoutPaymentElementHandle } from './payment-provider-confirmation'
import type { CheckoutPaymentSubmitResult } from './payment-submit-result'

export async function submitCheckoutPaymentSession({
  cartId,
  clientSecret,
  completePaymentSession,
  finishCheckoutOrder,
  isStripeElementReady,
  market,
  paymentSession,
  selectedPaymentMethod,
  selectedSavedPaymentProfileIdForSession,
  selectedShippingRate,
  setPaymentError,
  stripePaymentHandle,
  t,
}: {
  cartId: string
  clientSecret?: string
  completePaymentSession: (input: {
    selectedShippingRate: CartShippingRate | null
    sessionId: string
  }) => Promise<CheckoutPaymentSession>
  finishCheckoutOrder: () => Promise<CheckoutPaymentSubmitResult>
  isStripeElementReady: boolean
  market: {
    country: string
    locale: string
  }
  paymentSession: CheckoutPaymentSession | null
  selectedPaymentMethod: CheckoutPaymentMethod
  selectedSavedPaymentProfileIdForSession: string | null
  selectedShippingRate: CartShippingRate | null
  setPaymentError: (error: string | null) => void
  stripePaymentHandle: CheckoutPaymentElementHandle | null
  t: (key: MessageKey) => string
}): Promise<CheckoutPaymentSubmitResult> {
  if (selectedPaymentMethod.gatewayId !== 'stripe') {
    return {
      error: t('checkout.unsupportedSessionPayment'),
    }
  }

  if (!paymentSession || !clientSecret) {
    return {
      error: t('checkout.paymentSessionNotReady'),
    }
  }

  if (
    !selectedSavedPaymentProfileIdForSession &&
    (!stripePaymentHandle || !isStripeElementReady)
  ) {
    return {
      error: t('checkout.paymentFormNotReady'),
    }
  }

  const returnUrl = getCheckoutPaymentReturnUrl({
    cartId,
    country: market.country,
    locale: market.locale,
    sessionId: paymentSession.id,
  })
  const providerConfirmation = await confirmCheckoutPaymentProvider({
    clientSecret,
    confirmPaymentFallbackMessage: t('checkout.stripeConfirmPaymentFailed'),
    paymentFormNotReadyMessage: t('checkout.paymentFormNotReady'),
    returnUrl,
    savedPaymentProfileId: selectedSavedPaymentProfileIdForSession,
    stripeNotLoadedMessage: t('checkout.stripeNotLoaded'),
    stripePaymentHandle,
  })

  if (providerConfirmation.type === 'unknown') {
    return {
      confirmPaymentSessionId: paymentSession.id,
    }
  }

  if (providerConfirmation.type === 'error') {
    if (providerConfirmation.displayError !== false) {
      setPaymentError(providerConfirmation.message)
    }

    return {
      displayError: providerConfirmation.displayError,
      error: providerConfirmation.message,
    }
  }

  let completedSession: CheckoutPaymentSession

  try {
    completedSession = await completePaymentSession({
      selectedShippingRate,
      sessionId: paymentSession.id,
    })
  } catch {
    return {
      confirmPaymentSessionId: paymentSession.id,
    }
  }

  if (!isCompletedPaymentSessionStatus(completedSession.status)) {
    return {
      error: t('checkout.paymentFailed'),
    }
  }

  let orderCompletionResult: CheckoutPaymentSubmitResult

  try {
    orderCompletionResult = await finishCheckoutOrder()
  } catch {
    return {
      confirmPaymentSessionId: paymentSession.id,
    }
  }

  if (orderCompletionResult.error) {
    return {
      confirmPaymentSessionId: paymentSession.id,
    }
  }

  return orderCompletionResult
}
