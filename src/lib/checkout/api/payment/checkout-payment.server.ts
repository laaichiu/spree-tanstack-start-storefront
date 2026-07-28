import '@tanstack/react-start/server-only'

import type { Client, RequestOptions } from '@spree/sdk'

import type {
  CheckoutJsonValue,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import { mapSpreePaymentSession } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { readSafePaymentSessionErrorMessage } from '@/lib/checkout/utils/payment/payment-session'
import { buildServerCheckoutPaymentReturnUrl } from '@/lib/checkout/utils/payment/payment-return-url.server'

import type { CheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'
import { ensureCheckoutShippingRateForPayment } from '../checkout-order-state.server'
import {
  getCheckoutCartRequestOptions,
  requireCheckoutCustomerCartAssociation,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

type CheckoutPaymentSessionExternalData = Record<string, CheckoutJsonValue>

async function requireCheckoutPaymentMethod({
  cartId,
  cartToken,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference
}) {
  const checkoutOrder = await ensureCheckoutShippingRateForPayment({
    cartId,
    cartToken,
    market,
    selectedShippingRate,
  })

  if (!checkoutOrder) {
    throw new Error('Checkout order is not available.')
  }

  if (
    !checkoutOrder.paymentMethods.some(
      (method) => method.id === paymentMethodId,
    )
  ) {
    throw new Error('Selected payment method is no longer available.')
  }
}

function hasSavedStripePaymentMethod(
  externalData?: CheckoutPaymentSessionExternalData,
) {
  return (
    typeof externalData?.stripe_payment_method_id === 'string' &&
    externalData.stripe_payment_method_id.trim().length > 0
  )
}

async function assertSavedPaymentMethodBelongsToCustomer({
  client,
  externalData,
  requestOptions,
}: {
  client: Client
  externalData?: CheckoutPaymentSessionExternalData
  requestOptions: RequestOptions
}) {
  const paymentMethodId = externalData?.stripe_payment_method_id

  if (!paymentMethodId) {
    return
  }

  const cards = await client.customer.creditCards.list(
    undefined,
    requestOptions,
  )
  const isAvailable = cards.data.some(
    (card) => card.gateway_payment_profile_id === paymentMethodId,
  )

  if (!isAvailable) {
    throw new Error(
      'Saved payment method is no longer available. Choose another payment method.',
    )
  }
}

type CheckoutPaymentSessionPayload =
  | {
      external_data?: CheckoutPaymentSessionExternalData
      session_result?: string
    }
  | undefined

type CheckoutPaymentSessionResourceInput = {
  cartId: string
  client: Client
  errorFallback?: string
  payload?: CheckoutPaymentSessionPayload
  requestOptions: RequestOptions
  sessionId: string
}

export async function createCheckoutPaymentSessionOnServer({
  cartId,
  cartToken,
  externalData,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  externalData?: CheckoutPaymentSessionExternalData
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference
}): Promise<CheckoutPaymentSession> {
  const client = getServerSpreeClientForMarket(market)
  const requestOptions = hasSavedStripePaymentMethod(externalData)
    ? await requireCheckoutCustomerCartAssociation({
        cartId,
        cartToken,
        client,
        market,
      })
    : getCheckoutCartRequestOptions(cartToken)

  await assertSavedPaymentMethodBelongsToCustomer({
    client,
    externalData,
    requestOptions,
  })

  await requireCheckoutPaymentMethod({
    cartId,
    cartToken,
    market,
    paymentMethodId,
    selectedShippingRate,
  })

  const providerExternalData = {
    ...(externalData ?? {}),
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

  return mapSpreePaymentSession(session)
}

export async function completeCheckoutPaymentSessionResourceOnServer({
  cartId,
  client,
  errorFallback = 'Payment could not be confirmed. Please try again.',
  payload,
  requestOptions,
  sessionId,
}: CheckoutPaymentSessionResourceInput): Promise<CheckoutPaymentSession> {
  // The Store API resolves payment sessions through the requested cart and
  // authorizes the cart before completing it. Do not compare `order_id` here:
  // cart resources use the `cart_` ID namespace while payment sessions expose
  // the order's `or_` prefixed ID.

  const session = await client.carts.paymentSessions
    .complete(cartId, sessionId, payload, requestOptions)
    .catch((error: unknown) => {
      throw new Error(readSafePaymentSessionErrorMessage(error, errorFallback))
    })

  return mapSpreePaymentSession(session)
}

export async function completeCheckoutPaymentSessionOnServer({
  cartId,
  cartToken,
  externalData,
  market,
  selectedShippingRate,
  sessionId,
  sessionResult,
}: {
  cartId: string
  cartToken?: string
  externalData?: CheckoutPaymentSessionExternalData
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference
  sessionId: string
  sessionResult?: string
}): Promise<CheckoutPaymentSession> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  await ensureCheckoutShippingRateForPayment({
    cartId,
    cartToken,
    market,
    selectedShippingRate,
  })

  const client = getServerSpreeClientForMarket(market)

  return completeCheckoutPaymentSessionResourceOnServer({
    cartId,
    client,
    payload:
      sessionResult || externalData
        ? {
            ...(externalData ? { external_data: externalData } : {}),
            ...(sessionResult ? { session_result: sessionResult } : {}),
          }
        : undefined,
    requestOptions,
    sessionId,
  })
}

export async function createDirectCheckoutPaymentOnServer({
  cartId,
  cartToken,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference
}): Promise<{ success: true }> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  await requireCheckoutPaymentMethod({
    cartId,
    cartToken,
    market,
    paymentMethodId,
    selectedShippingRate,
  })

  await getServerSpreeClientForMarket(market).carts.payments.create(
    cartId,
    {
      payment_method_id: paymentMethodId,
    },
    requestOptions,
  )

  return { success: true }
}
