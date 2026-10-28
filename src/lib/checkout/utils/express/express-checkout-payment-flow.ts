import type {
  Stripe,
  StripeElements,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import type { MutableRefObject } from 'react'

import { getCheckoutOrderResourceId } from '@/lib/checkout/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import {
  getCheckoutPaymentReturnUrl,
  isCompletedPaymentSessionStatus,
  readSafePaymentSessionErrorMessage,
} from '../payment/payment-session'

import type { ExpressCheckoutPaymentActions } from './express-checkout-actions'
import { prepareExpressCheckoutPayment } from './express-checkout-payment-preparation'

type ExpressCheckoutPaymentFailureReason =
  | 'fail'
  | 'invalid_shipping_address'
  | 'invalid_billing_address'
  | 'invalid_payment_data'
  | 'address_unserviceable'

type ExpressCheckoutPaymentFlowOptions = {
  actions: ExpressCheckoutPaymentActions
  cartId: string
  elements: StripeElements | null
  event: StripeExpressCheckoutElementConfirmEvent
  isConfirmingRef: MutableRefObject<boolean>
  market: {
    country: string
    locale: string
  }
  redirectToConfirmation: (sessionId?: string) => Promise<void>
  redirectToOrderPlaced: (orderId: string) => Promise<void>
  setError: (error: string | null) => void
  setProcessing: (processing: boolean) => void
  stripe: Stripe | null
  stripeMethod: CheckoutPaymentMethod | null
  t: (key: MessageKey) => string
  isCurrent?: () => boolean
}

export async function runExpressCheckoutPayment({
  actions,
  cartId,
  elements,
  event,
  isConfirmingRef,
  market,
  redirectToConfirmation,
  redirectToOrderPlaced,
  setError,
  setProcessing,
  stripe,
  stripeMethod,
  t,
  isCurrent = () => true,
}: ExpressCheckoutPaymentFlowOptions) {
  if (
    !isCurrent() ||
    isConfirmingRef.current ||
    !stripe ||
    !elements ||
    !stripeMethod
  ) {
    event.paymentFailed({
      reason: 'fail',
    })
    return
  }

  isConfirmingRef.current = true
  setError(null)
  setProcessing(true)

  const fail = (
    reason: ExpressCheckoutPaymentFailureReason,
    message: string,
    fallbackMessage = t('checkout.paymentSubmitFailed'),
  ) => {
    const safeMessage = readSafePaymentSessionErrorMessage(
      message,
      fallbackMessage,
    )

    event.paymentFailed({
      message: safeMessage,
      reason,
    })
    setError(safeMessage)
  }

  let confirmedSessionId: string | null = null
  let paymentSessionCompleted = false
  let confirmationRedirectAttempted = false

  const redirectToConfirmationOnce = async (sessionId?: string) => {
    if (confirmationRedirectAttempted) {
      return false
    }

    confirmationRedirectAttempted = true
    await redirectToConfirmation(sessionId)

    return true
  }

  try {
    const preparation = await prepareExpressCheckoutPayment({
      actions,
      elements,
      event,
      stripe,
      stripeMethod,
      t,
    })

    if (!isCurrent()) {
      event.paymentFailed({ reason: 'fail' })
      return
    }

    if (!preparation.success) {
      fail(preparation.reason, preparation.message, preparation.fallbackMessage)
      return
    }

    const { clientSecret, paymentMethodId, selectedShippingRate, session } =
      preparation
    // Confirmation can leave the provider outcome unknown when the browser
    // loses the response. Keep the session id so the server recovery route can
    // inspect it instead of confirming the same PaymentIntent again.
    confirmedSessionId = session.id

    const returnUrl = getCheckoutPaymentReturnUrl({
      cartId,
      country: market.country,
      locale: market.locale,
      sessionId: session.id,
    })
    const confirmResult = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        payment_method: paymentMethodId,
        return_url: returnUrl,
      },
      redirect: 'if_required',
    })

    if (!isCurrent()) {
      event.paymentFailed({ reason: 'fail' })
      return
    }

    if (confirmResult.error) {
      fail(
        'fail',
        confirmResult.error.message || t('checkout.stripeConfirmPaymentFailed'),
        t('checkout.stripeConfirmPaymentFailed'),
      )
      return
    }

    const completedSession = await actions.completePaymentSession({
      selectedShippingRate,
      sessionId: session.id,
    })

    if (!isCurrent()) {
      event.paymentFailed({ reason: 'fail' })
      return
    }

    if (!isCompletedPaymentSessionStatus(completedSession.status)) {
      fail('fail', t('checkout.paymentFailed'))
      return
    }

    paymentSessionCompleted = true

    const completion = await actions.completeOrder({
      selectedShippingRate,
    })

    if (!isCurrent()) {
      event.paymentFailed({ reason: 'fail' })
      return
    }

    if (!completion.success) {
      await redirectToConfirmationOnce()
      return
    }

    await redirectToOrderPlaced(
      completion.order ? getCheckoutOrderResourceId(completion.order) : cartId,
    )
  } catch (confirmError) {
    if (!isCurrent()) {
      event.paymentFailed({ reason: 'fail' })
      return
    }

    if (confirmedSessionId) {
      const redirected = await redirectToConfirmationOnce(
        paymentSessionCompleted ? undefined : confirmedSessionId,
      )

      if (!redirected) {
        throw confirmError
      }

      return
    }

    fail(
      'fail',
      confirmError instanceof Error && confirmError.message
        ? confirmError.message
        : t('checkout.paymentSubmitFailed'),
    )
  } finally {
    if (isCurrent()) {
      setProcessing(false)
      isConfirmingRef.current = false
    }
  }
}
