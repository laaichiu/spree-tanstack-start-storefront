import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart, Client, Order as SpreeOrder } from '@spree/sdk'

import type { CheckoutCompletionResult } from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'
import { getSelectedCheckoutShippingRate } from '@/lib/checkout/utils/shipping/shipping-rate-selection'
import { isFailedPaymentSessionStatus } from '@/lib/checkout/utils/payment/payment-session'

import { completeCheckoutPaymentSessionResourceOnServer } from '../payment/checkout-payment.server'
import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutOrderResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'
import {
  ensureCheckoutShippingRateForPayment,
  readCheckoutOrderState,
} from '../checkout-order-state.server'
import type { CheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'
import { getCheckoutCartRequestOptions } from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

type CompletedCheckoutResource = SpreeCart | SpreeOrder

type ConfirmCheckoutPaymentInput = {
  adyenSessionId?: string
  cartId: string
  redirectResult?: string
  sessionId?: string
  sessionResult?: string
}

async function completeCheckoutOrderResourceOnServer({
  cartId,
  client,
  requestOptions,
}: {
  cartId: string
  client: Client
  requestOptions: ReturnType<typeof getCheckoutCartRequestOptions>
}): Promise<CompletedCheckoutResource> {
  return client.carts.complete(cartId, requestOptions)
}

export async function completeCheckoutOrderOnServer({
  cartId,
  cartToken,
  market,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference
}): Promise<CheckoutCompletionResult> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)
  const client = getServerSpreeClientForMarket(market)

  try {
    await ensureCheckoutShippingRateForPayment({
      cartId,
      cartToken,
      market,
      selectedShippingRate,
    })

    const order = await completeCheckoutOrderResourceOnServer({
      cartId,
      client,
      requestOptions,
    })

    return toCompletedCheckoutResourceResult({
      fallbackToken: cartToken,
      order,
      orderIds: [cartId],
    })
  } catch (error) {
    return recoverCheckoutCompletionResult({
      error,
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      fallbackToken: cartToken,
      lookupCompletedOrder: () =>
        client.orders.get(cartId, undefined, requestOptions).catch(() => null),
      orderIds: [cartId],
    })
  }
}

export async function confirmCheckoutPaymentAndCompleteOrderOnServer({
  cartToken,
  market,
  ...data
}: ConfirmCheckoutPaymentInput & {
  cartToken?: string
  market: CheckoutMarket
}): Promise<CheckoutCompletionResult> {
  const requestOptions = getCheckoutCartRequestOptions(cartToken)
  const client = getServerSpreeClientForMarket(market)

  try {
    const checkoutOrder = await readCheckoutOrderState({
      cartId: data.cartId,
      cartToken,
      market,
    })

    if (checkoutOrder?.currentStep === 'complete') {
      return toCompletedCheckoutOrderResult({
        order: checkoutOrder,
        orderIds: [data.cartId, checkoutOrder.id],
        orderToken: cartToken,
      })
    }

    if (!checkoutOrder) {
      const completedOrder = await client.orders
        .get(data.cartId, undefined, requestOptions)
        .catch(() => null)

      if (completedOrder && isSpreeCompletedOrder(completedOrder)) {
        return toCompletedCheckoutResourceResult({
          fallbackToken: cartToken,
          order: completedOrder,
          orderIds: [data.cartId],
        })
      }

      return {
        error: 'Failed to confirm payment. Please try again.',
        errorCode: 'payment_confirmation_failed',
        order: completedOrder ? mapSpreeCheckoutToOrder(completedOrder) : null,
        success: false,
      }
    }

    const paymentReadyOrder =
      (await ensureCheckoutShippingRateForPayment({
        cartId: data.cartId,
        cartToken,
        market,
        selectedShippingRate:
          getSelectedCheckoutShippingRate(checkoutOrder) ?? undefined,
      })) ?? checkoutOrder

    if (paymentReadyOrder.currentStep === 'complete') {
      return toCompletedCheckoutOrderResult({
        order: paymentReadyOrder,
        orderIds: [data.cartId, paymentReadyOrder.id],
        orderToken: cartToken,
      })
    }

    if (data.sessionId) {
      const session = await completeCheckoutPaymentSessionResourceOnServer({
        cartId: data.cartId,
        client,
        errorFallback: 'Failed to confirm payment. Please try again.',
        payload:
          data.sessionResult || data.redirectResult
            ? {
                ...(data.sessionResult
                  ? { session_result: data.sessionResult }
                  : {}),
                ...(data.redirectResult
                  ? { external_data: { redirect_result: data.redirectResult } }
                  : {}),
              }
            : undefined,
        requestOptions,
        sessionId: data.sessionId,
      })

      if (isFailedPaymentSessionStatus(session.status)) {
        return {
          error: 'Payment was not successful. Please try again.',
          errorCode: 'payment_failed',
          success: false,
        }
      }
    } else if (data.redirectResult) {
      if (!data.adyenSessionId) {
        return {
          error: 'Payment session is not available.',
          errorCode: 'payment_session_not_ready',
          success: false,
        }
      }

      const session = await completeCheckoutPaymentSessionResourceOnServer({
        cartId: data.cartId,
        client,
        errorFallback: 'Failed to confirm payment. Please try again.',
        payload: {
          external_data: {
            redirect_result: data.redirectResult,
          },
        },
        requestOptions,
        sessionId: data.adyenSessionId,
      })

      if (isFailedPaymentSessionStatus(session.status)) {
        return {
          error: 'Payment was not successful. Please try again.',
          errorCode: 'payment_failed',
          success: false,
        }
      }
    }

    const completedOrder = await completeCheckoutOrderResourceOnServer({
      cartId: data.cartId,
      client,
      requestOptions,
    })

    return toCompletedCheckoutResourceResult({
      fallbackToken: cartToken,
      order: completedOrder,
      orderIds: [data.cartId],
    })
  } catch (error) {
    return recoverCheckoutCompletionResult({
      error,
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      fallbackToken: cartToken,
      lookupCompletedOrder: () =>
        client.orders
          .get(data.cartId, undefined, requestOptions)
          .catch(() => null),
      orderIds: [data.cartId],
    })
  }
}
