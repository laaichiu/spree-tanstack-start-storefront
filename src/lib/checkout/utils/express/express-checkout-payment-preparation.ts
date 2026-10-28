import type {
  Stripe,
  StripeElements,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'

import { getSelectedCheckoutShippingRate } from '@/lib/checkout/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MessageKey } from '@/lib/i18n/messages'

import {
  buildExpressCheckoutAddressParams,
  parseExpressCheckoutName,
} from './express-checkout-address'
import type { ExpressCheckoutPaymentActions } from './express-checkout-actions'
import { readStripeClientSecret } from '../payment/payment-session'
import type { CheckoutPaymentSession } from '../payment/payment-session-contract'

export type ExpressCheckoutPaymentPreparationFailureReason =
  'fail' | 'invalid_shipping_address' | 'invalid_payment_data'

export type ExpressCheckoutPaymentPreparationResult =
  | {
      success: false
      reason: ExpressCheckoutPaymentPreparationFailureReason
      message: string
      fallbackMessage?: string
    }
  | {
      success: true
      clientSecret: string
      paymentMethodId: string
      selectedShippingRate: ReturnType<typeof getSelectedCheckoutShippingRate>
      session: CheckoutPaymentSession
    }

type ExpressCheckoutPaymentPreparationOptions = {
  actions: Pick<
    ExpressCheckoutPaymentActions,
    'createPaymentSession' | 'preparePayment'
  >
  elements: StripeElements
  event: StripeExpressCheckoutElementConfirmEvent
  stripe: Stripe
  stripeMethod: CheckoutPaymentMethod
  t: (key: MessageKey) => string
}

export async function prepareExpressCheckoutPayment({
  actions,
  elements,
  event,
  stripe,
  stripeMethod,
  t,
}: ExpressCheckoutPaymentPreparationOptions): Promise<ExpressCheckoutPaymentPreparationResult> {
  const billingDetails = event.billingDetails
  const shippingAddress = event.shippingAddress
  const shipAddress = shippingAddress?.address ?? billingDetails?.address
  const billAddress = billingDetails?.address ?? shippingAddress?.address
  const email = billingDetails?.email?.trim() ?? ''
  const phone = billingDetails?.phone ?? ''

  if (!shipAddress || !billAddress || !email) {
    return {
      message: t('checkout.paymentSubmitFailed'),
      reason: 'invalid_shipping_address',
      success: false,
    }
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
    return {
      message: preparedResult.error,
      reason: 'invalid_shipping_address',
      success: false,
    }
  }

  const submission = await elements.submit()

  if (submission.error) {
    return {
      fallbackMessage: t('checkout.paymentSubmitFailed'),
      message: submission.error.message || t('checkout.paymentSubmitFailed'),
      reason: 'fail',
      success: false,
    }
  }

  const paymentMethodResult = await stripe.createPaymentMethod({ elements })

  if (paymentMethodResult.error) {
    return {
      fallbackMessage: t('checkout.paymentSubmitFailed'),
      message:
        paymentMethodResult.error.message || t('checkout.paymentSubmitFailed'),
      reason: 'invalid_payment_data',
      success: false,
    }
  }

  const { paymentMethod } = paymentMethodResult
  const preparedOrder = preparedResult.order
  const sessionPaymentMethod =
    preparedOrder.paymentMethods.find(
      (method) => method.gatewayId === 'stripe' && method.sessionRequired,
    ) ?? stripeMethod
  const selectedShippingRate = getSelectedCheckoutShippingRate(preparedOrder)
  const session = await actions.createPaymentSession({
    paymentData: {
      stripePaymentMethodId: paymentMethod.id,
    },
    paymentMethodId: sessionPaymentMethod.id,
    selectedShippingRate,
  })
  const clientSecret = readStripeClientSecret(session.providerData)

  if (!clientSecret) {
    return {
      message: t('checkout.stripeClientSecretMissing'),
      reason: 'fail',
      success: false,
    }
  }

  return {
    clientSecret,
    paymentMethodId: paymentMethod.id,
    selectedShippingRate,
    session,
    success: true,
  }
}
