import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { MessageKey } from '@/lib/i18n/messages'
import type {
  CheckoutCompletionResult,
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import { getCheckoutCompletionErrorMessage } from '@/lib/checkout/utils/completion/checkout-completion-error'
import {
  getCheckoutPaymentReturnUrl,
  isFailedPaymentSessionStatus,
} from '@/lib/checkout/utils/payment/payment-session'

import { confirmStripeSavedCardPayment } from './stripe-payment-confirmation'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import type { CheckoutPaymentSubmitResult } from './checkout-payment-submit-result'

type CheckoutPaymentSubmitFlowOptions = {
  amountDue: number | null
  cartId: string
  clientSecret?: string
  completeOrder: (input: {
    selectedShippingRate: CartShippingRate | null
  }) => Promise<CheckoutCompletionResult>
  completePaymentSession: (input: {
    selectedShippingRate: CartShippingRate | null
    sessionId: string
  }) => Promise<CheckoutPaymentSession>
  createDirectPayment: (input: {
    paymentMethodId: string
    selectedShippingRate: CartShippingRate | null
  }) => Promise<unknown>
  isStripeElementReady: boolean
  market: {
    country: string
    locale: string
  }
  onPaymentSubmitEnd: () => void
  onPaymentSubmitStart: () => void
  paymentSession: CheckoutPaymentSession | null
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedPaymentProfileIdForSession: string | null
  selectedShippingRate: CartShippingRate | null
  setPaymentError: (error: string | null) => void
  shippingReady: boolean
  stripePaymentHandle: StripePaymentElementHandle | null
  t: (key: MessageKey) => string
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function submitCheckoutPayment({
  amountDue,
  cartId,
  clientSecret,
  completeOrder,
  completePaymentSession,
  createDirectPayment,
  isStripeElementReady,
  market,
  onPaymentSubmitEnd,
  onPaymentSubmitStart,
  paymentSession,
  selectedPaymentMethod,
  selectedSavedPaymentProfileIdForSession,
  selectedShippingRate,
  setPaymentError,
  shippingReady,
  stripePaymentHandle,
  t,
}: CheckoutPaymentSubmitFlowOptions): Promise<CheckoutPaymentSubmitResult> {
  if (amountDue === null) {
    return {
      error: t('checkout.paymentSessionNotReady'),
    }
  }

  if (!shippingReady) {
    return {
      error: t('checkout.selectShippingBeforePayment'),
    }
  }

  const finishCheckoutOrder =
    async (): Promise<CheckoutPaymentSubmitResult> => {
      const result = await completeOrder({
        selectedShippingRate,
      })

      if (!result.success) {
        return {
          error: getCheckoutCompletionErrorMessage({
            error: result.error,
            errorCode: result.errorCode,
            t,
          }),
        }
      }

      return {
        order: result.order,
      }
    }

  if (amountDue <= 0) {
    return finishCheckoutOrder()
  }

  if (!selectedPaymentMethod) {
    return {
      error: t('checkout.selectPaymentMethod'),
    }
  }

  setPaymentError(null)
  onPaymentSubmitStart()

  try {
    if (!selectedPaymentMethod.sessionRequired) {
      await createDirectPayment({
        paymentMethodId: selectedPaymentMethod.id,
        selectedShippingRate,
      })

      return await finishCheckoutOrder()
    }

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
    const confirmResult = selectedSavedPaymentProfileIdForSession
      ? await confirmStripeSavedCardPayment({
          clientSecret,
          confirmPaymentFallbackMessage: t(
            'checkout.stripeConfirmPaymentFailed',
          ),
          paymentMethodId: selectedSavedPaymentProfileIdForSession,
          returnUrl,
          stripeNotLoadedMessage: t('checkout.stripeNotLoaded'),
        })
      : await stripePaymentHandle!.confirmPayment(returnUrl)

    if (confirmResult.error) {
      if (confirmResult.displayError !== false) {
        setPaymentError(confirmResult.error)
      }

      return {
        displayError: confirmResult.displayError,
        error: confirmResult.error,
      }
    }

    const completedSession = await completePaymentSession({
      selectedShippingRate,
      sessionId: paymentSession.id,
    })

    if (isFailedPaymentSessionStatus(completedSession.status)) {
      return {
        error: t('checkout.paymentFailed'),
      }
    }

    const orderCompletionResult = await finishCheckoutOrder()

    if (orderCompletionResult.error) {
      return {
        confirmPaymentSessionId: paymentSession.id,
      }
    }

    return orderCompletionResult
  } catch (error) {
    const message = getMutationErrorMessage(
      error,
      t('checkout.paymentSubmitFailed'),
    )

    setPaymentError(message)

    return {
      error: message,
    }
  } finally {
    onPaymentSubmitEnd()
  }
}
