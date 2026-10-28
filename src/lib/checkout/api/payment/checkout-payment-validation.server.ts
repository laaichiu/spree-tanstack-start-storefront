import '@tanstack/react-start/server-only'

import type { Client, RequestOptions } from '@spree/sdk'

import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import { assertCustomerCreditCardResourceIsCreditCard } from '@/lib/account/utils/credit-card-identity'
import { assertCustomerListResponse } from '@/lib/account/utils/customer-list-response'
import type { CheckoutPaymentSessionInputData } from '@/lib/checkout/utils/payment/payment-session-contract'
import type { CheckoutShippingRateReference } from '@/lib/checkout/contracts'
import {
  getCheckoutCartRequestOptions,
  requireCheckoutCustomerCartAssociation,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import { ensureCheckoutShippingRateForPaymentWithToken } from '../checkout-order-state.server'
import { withCustomerSession } from '@/lib/account/api/customer-session.server'

const SAVED_PAYMENT_METHOD_ERROR =
  'Saved payment method is no longer available. Choose another payment method.'

function hasSavedStripePaymentMethod(
  paymentData?: CheckoutPaymentSessionInputData,
) {
  return (
    typeof paymentData?.stripePaymentMethodId === 'string' &&
    paymentData.stripePaymentMethodId.trim().length > 0
  )
}

async function assertSavedPaymentMethodBelongsToCustomer({
  client,
  paymentData,
  requestOptions,
}: {
  client: Client
  paymentData?: CheckoutPaymentSessionInputData
  requestOptions: RequestOptions
}) {
  const paymentMethodId = paymentData?.stripePaymentMethodId

  if (!paymentMethodId) {
    return
  }

  const cards = await client.customer.creditCards.list(
    undefined,
    requestOptions,
  )
  assertCustomerListResponse(cards)
  cards.data.forEach(assertCustomerCreditCardResourceIsCreditCard)
  const isAvailable = cards.data.some(
    (card) => card.gateway_payment_profile_id === paymentMethodId,
  )

  if (!isAvailable) {
    throw new Error(SAVED_PAYMENT_METHOD_ERROR)
  }
}

export async function getCheckoutPaymentRequestOptions({
  cartId,
  cartToken,
  client,
  market,
  paymentData,
}: {
  cartId: string
  cartToken?: string
  client: Client
  market: CheckoutMarket
  paymentData?: CheckoutPaymentSessionInputData
}): Promise<RequestOptions> {
  if (!hasSavedStripePaymentMethod(paymentData)) {
    const requestOptions = getCheckoutCartRequestOptions(cartToken)

    await assertSavedPaymentMethodBelongsToCustomer({
      client,
      paymentData,
      requestOptions,
    })

    return requestOptions
  }

  try {
    return await withCustomerSession(
      async ({ client: sessionClient, token }) => {
        const requestOptions = await requireCheckoutCustomerCartAssociation({
          cartId,
          cartToken,
          client: sessionClient,
          customerToken: token,
          market,
        })

        await assertSavedPaymentMethodBelongsToCustomer({
          client: sessionClient,
          paymentData,
          requestOptions,
        })

        return requestOptions
      },
      { client },
    )
  } catch (error) {
    if (isCustomerSessionRequiredError(error)) {
      throw new Error(
        'Sign in again to use a saved payment method, or choose a new payment method.',
      )
    }

    throw error
  }
}

export async function requireCheckoutPaymentMethod({
  cartId,
  cartToken,
  customerToken,
  expectedCurrentCartToken,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  customerToken?: string
  expectedCurrentCartToken?: string
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<{ cartToken?: string }> {
  const { cartToken: updatedCartToken, checkoutOrder } =
    await ensureCheckoutShippingRateForPaymentWithToken({
      cartId,
      cartToken,
      customerToken,
      expectedCurrentCartToken,
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

  return { cartToken: updatedCartToken }
}
