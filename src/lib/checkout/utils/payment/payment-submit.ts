import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MessageKey } from '../../../i18n/messages'

import type { CheckoutCompletionResult } from '../completion/checkout-completion-contract'
import { getCheckoutCompletionErrorMessage } from '../completion/checkout-completion-error'
import { readSafePaymentSessionErrorMessage } from './payment-session'
import type { CheckoutPaymentSession } from './payment-session-contract'
import { getCheckoutPaymentSubmitDecision } from './payment-submit-decision'
import type { CheckoutPaymentSubmitResult } from './payment-submit-result'
import { submitCheckoutPaymentSession } from './payment-session-submit'
import type { CheckoutPaymentElementHandle } from './payment-provider-confirmation'

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
}: {
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
  stripePaymentHandle: CheckoutPaymentElementHandle | null
  t: (key: MessageKey) => string
}): Promise<CheckoutPaymentSubmitResult> {
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

  const decision = getCheckoutPaymentSubmitDecision(
    amountDue,
    selectedPaymentMethod,
    shippingReady,
  )

  if (typeof decision === 'string') {
    if (decision === 'complete') {
      return finishCheckoutOrder()
    }

    return { error: t(decision) }
  }

  const paymentMethod = decision

  setPaymentError(null)
  onPaymentSubmitStart()

  try {
    if (!paymentMethod.sessionRequired) {
      await createDirectPayment({
        paymentMethodId: paymentMethod.id,
        selectedShippingRate,
      })

      return await finishCheckoutOrder()
    }

    return submitCheckoutPaymentSession({
      cartId,
      clientSecret,
      completePaymentSession,
      finishCheckoutOrder,
      isStripeElementReady,
      market,
      paymentSession,
      selectedPaymentMethod: paymentMethod,
      selectedSavedPaymentProfileIdForSession,
      selectedShippingRate,
      setPaymentError,
      stripePaymentHandle,
      t,
    })
  } catch (error) {
    const message = readSafePaymentSessionErrorMessage(
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
