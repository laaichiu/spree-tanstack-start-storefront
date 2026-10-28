import type { CartShippingRate } from '@/lib/cart/contracts'
import {
  getCheckoutPaymentStateKey,
  getSelectedCheckoutShippingRate,
} from '@/lib/checkout/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'

export type CheckoutPaymentSubmitRefreshAction =
  | {
      cartId: string
      type: 'navigate_checkout'
    }
  | {
      paymentStateKey: string
      shippingRate: CartShippingRate | null
      type: 'queue_payment_submit'
    }
  | {
      type: 'submit_payment'
    }

export function getCheckoutPaymentSubmitRefreshAction({
  currentCartId,
  fallbackShippingRate,
  paymentReadyCart,
  previousPaymentStateKey,
}: {
  currentCartId: string
  fallbackShippingRate: CartShippingRate | null
  paymentReadyCart: CheckoutOrder
  previousPaymentStateKey: string
}): CheckoutPaymentSubmitRefreshAction {
  if (paymentReadyCart.id !== currentCartId) {
    return {
      cartId: paymentReadyCart.id,
      type: 'navigate_checkout',
    }
  }

  const nextPaymentStateKey = getCheckoutPaymentStateKey(paymentReadyCart)

  if (nextPaymentStateKey !== previousPaymentStateKey) {
    return {
      paymentStateKey: nextPaymentStateKey,
      shippingRate:
        getSelectedCheckoutShippingRate(paymentReadyCart) ??
        fallbackShippingRate,
      type: 'queue_payment_submit',
    }
  }

  return {
    type: 'submit_payment',
  }
}
