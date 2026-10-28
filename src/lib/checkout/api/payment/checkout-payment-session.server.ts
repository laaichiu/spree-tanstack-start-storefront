import '@tanstack/react-start/server-only'

import type { Client, RequestOptions } from '@spree/sdk'

import type { CheckoutShippingRateReference } from '@/lib/checkout/contracts'
import type {
  CheckoutPaymentSession,
  CheckoutPaymentSessionInputData,
} from '@/lib/checkout/utils/payment/payment-session-contract'
import { assertPaymentSessionMatchesMarket } from '@/lib/checkout/utils/payment/payment-session-market'
import {
  assertPaymentSessionMatchesCart,
  assertPaymentSessionMatchesId,
  assertPaymentSessionMatchesPaymentMethod,
} from '@/lib/checkout/utils/payment/payment-session-identity'
import { assertPaymentSessionResponse } from '@/lib/checkout/utils/payment/payment-session-response'
import { mapSpreePaymentSession } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { readSpreeErrorCode, readSpreeErrorStatus } from '@/lib/spree/errors'
import { readSafePaymentSessionErrorMessage } from '@/lib/checkout/utils/payment/payment-session'
import { buildServerCheckoutPaymentReturnUrl } from '@/lib/checkout/utils/payment/payment-return-url.server'
import { ensureCheckoutShippingRateForPaymentWithToken } from '../checkout-order-state.server'
import { getCheckoutCartRequestOptions } from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import {
  getCheckoutPaymentRequestOptions,
  requireCheckoutPaymentMethod,
} from './checkout-payment-validation.server'

type CheckoutPaymentSessionCreateExternalData = {
  return_url: string
  stripe_payment_method_id?: string
}

export type CheckoutPaymentSessionCompletionPayload = {
  external_data?: {
    redirect_result: string
  }
  session_result?: string
}

export type CheckoutPaymentSessionResourceInput = {
  cartId: string
  client: Client
  errorFallback?: string
  payload?: CheckoutPaymentSessionCompletionPayload
  requestOptions: RequestOptions
  sessionId: string
  market: CheckoutMarket
}

export async function createCheckoutPaymentSessionOnServer({
  cartId,
  cartToken,
  paymentData,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  paymentData?: CheckoutPaymentSessionInputData
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<CheckoutPaymentSession> {
  const client = getServerSpreeClientForMarket(market)
  const paymentRequestOptions = await getCheckoutPaymentRequestOptions({
    cartId,
    cartToken,
    client,
    market,
    paymentData,
  })

  const { cartToken: updatedCartToken } = await requireCheckoutPaymentMethod({
    cartId,
    cartToken: paymentRequestOptions.spreeToken ?? cartToken,
    customerToken: paymentRequestOptions.token,
    expectedCurrentCartToken: paymentRequestOptions.spreeToken ?? cartToken,
    market,
    paymentMethodId,
    selectedShippingRate,
  })

  const requestOptions = getCheckoutCartRequestOptions(
    updatedCartToken,
    paymentRequestOptions.token,
  )

  const providerExternalData: CheckoutPaymentSessionCreateExternalData = {
    ...(paymentData?.stripePaymentMethodId
      ? { stripe_payment_method_id: paymentData.stripePaymentMethodId }
      : {}),
    return_url: buildServerCheckoutPaymentReturnUrl({
      cartId,
      country: market.country,
      locale: market.locale,
    }),
  }

  const session = await client.carts.paymentSessions
    .create(
      cartId,
      {
        external_data: providerExternalData,
        payment_method_id: paymentMethodId,
      },
      requestOptions,
    )
    .catch((error: unknown) => {
      throw new Error(
        readSafePaymentSessionErrorMessage(
          error,
          'Payment session could not be initialized.',
        ),
      )
    })

  assertPaymentSessionMatchesCart(session, cartId)
  assertPaymentSessionMatchesPaymentMethod(session, paymentMethodId)
  assertPaymentSessionMatchesMarket(session, market)
  assertPaymentSessionResponse(session)

  return mapSpreePaymentSession(session)
}

export async function completeCheckoutPaymentSessionResourceOnServer({
  cartId,
  client,
  errorFallback = 'Payment could not be confirmed. Please try again.',
  payload,
  requestOptions,
  sessionId,
  market,
}: CheckoutPaymentSessionResourceInput): Promise<CheckoutPaymentSession> {
  // The Store API resolves payment sessions through the requested cart and
  // authorizes the cart before completing it. The endpoint accepts either the
  // PaymentSession prefixed id or the provider's external id, so the identity
  // guard must validate the matching field without comparing `order_id`:
  // cart resources use the `cart_` ID namespace while payment sessions expose
  // the order's `or_` prefixed ID.
  const session = await client.carts.paymentSessions
    .complete(cartId, sessionId, payload, requestOptions)
    .catch((error: unknown) => {
      throw createCheckoutPaymentSessionError(error, errorFallback)
    })

  assertPaymentSessionMatchesId(session, sessionId)
  assertPaymentSessionMatchesCart(session, cartId)
  assertPaymentSessionMatchesMarket(session, market)
  assertPaymentSessionResponse(session)

  return mapSpreePaymentSession(session)
}

function createCheckoutPaymentSessionError(
  error: unknown,
  fallbackMessage: string,
) {
  const safeError = new Error(
    readSafePaymentSessionErrorMessage(error, fallbackMessage),
  )
  const status = readSpreeErrorStatus(error)
  const code = readSpreeErrorCode(error)

  if (status === undefined && code === undefined) {
    return safeError
  }

  return Object.assign(safeError, {
    ...(status === undefined ? {} : { status }),
    ...(code === undefined ? {} : { code }),
  })
}

export async function completeCheckoutPaymentSessionOnServer({
  cartId,
  cartToken,
  market,
  selectedShippingRate,
  sessionId,
  sessionResult,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference | undefined
  sessionId: string
  sessionResult?: string
}): Promise<CheckoutPaymentSession> {
  const { cartToken: updatedCartToken, checkoutOrder } =
    await ensureCheckoutShippingRateForPaymentWithToken({
      cartId,
      cartToken,
      expectedCurrentCartToken: cartToken,
      market,
      selectedShippingRate,
    })

  if (!checkoutOrder) {
    throw new Error('Checkout order is not available.')
  }

  const requestOptions = getCheckoutCartRequestOptions(updatedCartToken)

  return completeCheckoutPaymentSessionResourceOnServer({
    cartId,
    client: getServerSpreeClientForMarket(market),
    payload: sessionResult
      ? {
          session_result: sessionResult,
        }
      : undefined,
    requestOptions,
    sessionId,
    market,
  })
}
