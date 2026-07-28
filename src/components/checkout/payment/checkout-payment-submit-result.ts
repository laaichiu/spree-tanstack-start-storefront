import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

export type CheckoutPaymentSubmitResult =
  | {
      confirmPaymentSessionId?: never
      displayError?: boolean
      error: string
      order?: never
    }
  | {
      confirmPaymentSessionId?: never
      error?: never
      order: CheckoutOrder | null
    }
  | {
      confirmPaymentSessionId: string
      error?: never
      order?: never
    }

export type CheckoutRenderedPaymentSubmitAction =
  | {
      message: string
      type: 'show_payment_error'
    }
  | {
      type: 'ignore_error'
    }
  | {
      type: 'confirm_payment'
    }
  | {
      order: CheckoutOrder | null
      orderId: string
      type: 'order_placed'
    }

export function getCheckoutRenderedPaymentSubmitAction({
  cartId,
  paymentFormNotReadyMessage,
  result,
}: {
  cartId: string
  paymentFormNotReadyMessage: string
  result: CheckoutPaymentSubmitResult | undefined
}): CheckoutRenderedPaymentSubmitAction {
  if (!result) {
    return {
      message: paymentFormNotReadyMessage,
      type: 'show_payment_error',
    }
  }

  if (result.error) {
    if (result.displayError === false) {
      return {
        type: 'ignore_error',
      }
    }

    return {
      message: result.error,
      type: 'show_payment_error',
    }
  }

  if (result.confirmPaymentSessionId) {
    return {
      type: 'confirm_payment',
    }
  }

  return {
    order: result.order ?? null,
    orderId: result.order?.id ?? cartId,
    type: 'order_placed',
  }
}
