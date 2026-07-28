import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart, Order as SpreeOrder } from '@spree/sdk'

import type {
  CheckoutCompletionErrorCode,
  CheckoutCompletionResult,
  CheckoutOrder,
} from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { clearCartCookies } from '@/lib/cookies/cart-cookie.server'
import {
  isRecoverableCheckoutCompletionStatus,
  isSpreeCompletedOrder,
  readCheckoutErrorStatus,
} from '@/lib/checkout/utils/payment/payment-completion'
import { readSafePaymentSessionErrorMessage } from '@/lib/checkout/utils/payment/payment-session'

import {
  persistCompletedOrderAccess,
  persistCompletedOrderResourceAccess,
} from '../checkout-session.server'

type CompletedCheckoutResource = SpreeCart | SpreeOrder

type CheckoutCompletionRecoverableErrorCode = Extract<
  CheckoutCompletionErrorCode,
  'order_complete_failed' | 'payment_confirmation_failed'
>

export function toCompletedCheckoutOrderResult({
  order,
  orderIds,
  orderToken,
}: {
  order: CheckoutOrder
  orderIds: string[]
  orderToken?: string
}): CheckoutCompletionResult {
  persistCompletedOrderAccess({
    orderIds,
    orderToken,
  })
  clearCartCookies()

  return {
    order,
    success: true,
  }
}

export function toCompletedCheckoutResourceResult({
  fallbackToken,
  order,
  orderIds,
}: {
  fallbackToken?: string
  order: CompletedCheckoutResource
  orderIds: string[]
}): CheckoutCompletionResult {
  persistCompletedOrderResourceAccess({
    fallbackToken,
    order,
    orderIds,
  })
  clearCartCookies()

  return {
    order: mapSpreeCheckoutToOrder(order),
    success: true,
  }
}

export async function recoverCheckoutCompletionResult({
  error,
  errorCode,
  fallbackMessage,
  fallbackToken,
  lookupCompletedOrder,
  orderIds,
}: {
  error: unknown
  errorCode: CheckoutCompletionRecoverableErrorCode
  fallbackMessage: string
  fallbackToken?: string
  lookupCompletedOrder: () => Promise<CompletedCheckoutResource | null>
  orderIds: string[]
}): Promise<CheckoutCompletionResult> {
  const status = readCheckoutErrorStatus(error)

  if (isRecoverableCheckoutCompletionStatus(status)) {
    const order = await lookupCompletedOrder()

    if (order && isSpreeCompletedOrder(order as { completed_at?: unknown })) {
      return toCompletedCheckoutResourceResult({
        fallbackToken,
        order,
        orderIds,
      })
    }

    return {
      error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
      errorCode,
      order: order ? mapSpreeCheckoutToOrder(order) : null,
      success: false,
    }
  }

  return {
    error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
    errorCode,
    success: false,
  }
}
