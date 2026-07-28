import type {
  Stripe,
  StripeElements,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import type { MutableRefObject } from 'react'

import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'
import type { MessageKey } from '@/lib/i18n/messages'
import {
  buildExpressCheckoutAddressParams,
  parseExpressCheckoutName,
} from '@/lib/checkout/utils/express/express-checkout'
import {
  getCheckoutPaymentReturnUrl,
  isFailedPaymentSessionStatus,
  readStripeClientSecret,
} from '@/lib/checkout/utils/payment/payment-session'
import { getSelectedCheckoutShippingRate } from '@/lib/checkout/utils/shipping/shipping-rate-selection'

import type { useExpressCheckoutActions } from './use-express-checkout'

type ExpressCheckoutActions = ReturnType<typeof useExpressCheckoutActions>

type ExpressCheckoutPaymentFailureReason =
  | 'fail'
  | 'invalid_shipping_address'
  | 'invalid_billing_address'
  | 'invalid_payment_data'
  | 'address_unserviceable'

type ExpressCheckoutPaymentFlowOptions = {
  actions: ExpressCheckoutActions
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
}: ExpressCheckoutPaymentFlowOptions) {
  if (isConfirmingRef.current || !stripe || !elements || !stripeMethod) {
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
  ) => {
    event.paymentFailed({
      message,
      reason,
    })
    setError(message)
    setProcessing(false)
    isConfirmingRef.current = false
  }

  let confirmedSessionId: string | null = null
  let paymentSessionCompleted = false

  try {
    const billingDetails = event.billingDetails
    const shippingAddress = event.shippingAddress
    const shipAddress = shippingAddress?.address ?? billingDetails?.address
    const billAddress = billingDetails?.address ?? shippingAddress?.address
    const email = billingDetails?.email?.trim() ?? ''
    const phone = billingDetails?.phone ?? ''

    if (!shipAddress || !billAddress || !email) {
      fail('invalid_shipping_address', t('checkout.paymentSubmitFailed'))
      return
    }

    const preparedResult = await actions.preparePayment({
      billingAddress: buildExpressCheckoutAddressParams({
        address: billAddress,
        name: parseExpressCheckoutName(
          billingDetails?.name ?? shippingAddress?.name ?? '',
        ),
        phone,
      }),
      email,
      shippingAddress: buildExpressCheckoutAddressParams({
        address: shipAddress,
        name: parseExpressCheckoutName(
          shippingAddress?.name ?? billingDetails?.name ?? '',
        ),
        phone,
      }),
    })

    if (!preparedResult.success) {
      fail('invalid_shipping_address', preparedResult.error)
      return
    }

    const submission = await elements.submit()

    if (submission.error) {
      fail(
        'fail',
        submission.error.message || t('checkout.paymentSubmitFailed'),
      )
      return
    }

    const paymentMethodResult = await stripe.createPaymentMethod({
      elements,
    })

    if (paymentMethodResult.error) {
      fail(
        'invalid_payment_data',
        paymentMethodResult.error.message || t('checkout.paymentSubmitFailed'),
      )
      return
    }

    const { paymentMethod } = paymentMethodResult
    const preparedOrder = preparedResult.order
    const sessionPaymentMethod =
      preparedOrder.paymentMethods.find(
        (method) => method.gatewayId === 'stripe' && method.sessionRequired,
      ) ?? stripeMethod
    const selectedShippingRate = getSelectedCheckoutShippingRate(preparedOrder)
    const session = await actions.createPaymentSession({
      externalData: {
        stripe_payment_method_id: paymentMethod.id,
      },
      paymentMethodId: sessionPaymentMethod.id,
      selectedShippingRate,
    })
    const clientSecret = readStripeClientSecret(session.externalData)

    if (!clientSecret) {
      fail('fail', t('checkout.stripeClientSecretMissing'))
      return
    }

    const returnUrl = getCheckoutPaymentReturnUrl({
      cartId,
      country: market.country,
      locale: market.locale,
      sessionId: session.id,
    })
    const confirmResult = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        payment_method: paymentMethod.id,
        return_url: returnUrl,
      },
      redirect: 'if_required',
    })

    if (confirmResult.error) {
      fail(
        'fail',
        confirmResult.error.message || t('checkout.stripeConfirmPaymentFailed'),
      )
      return
    }

    confirmedSessionId = session.id

    const completedSession = await actions.completePaymentSession({
      selectedShippingRate,
      sessionId: session.id,
    })

    if (isFailedPaymentSessionStatus(completedSession.status)) {
      fail('fail', t('checkout.paymentFailed'))
      return
    }

    paymentSessionCompleted = true

    const completion = await actions.completeOrder({
      selectedShippingRate,
    })

    if (!completion.success) {
      await redirectToConfirmation()
      return
    }

    await redirectToOrderPlaced(completion.order?.id ?? cartId)
  } catch (confirmError) {
    if (confirmedSessionId) {
      await redirectToConfirmation(
        paymentSessionCompleted ? undefined : confirmedSessionId,
      )
      return
    }

    fail(
      'fail',
      confirmError instanceof Error && confirmError.message
        ? confirmError.message
        : t('checkout.paymentSubmitFailed'),
    )
    return
  }

  setProcessing(false)
  isConfirmingRef.current = false
}
