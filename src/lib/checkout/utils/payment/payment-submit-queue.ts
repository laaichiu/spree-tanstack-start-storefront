import type { CartShippingRate } from '@/lib/cart/model/cart'

import { findMatchingCheckoutShippingRate } from '../shipping/shipping-rate-selection'

export type PendingCheckoutPaymentSubmitAction =
  | { type: 'idle' }
  | { type: 'wait' }
  | { type: 'select_shipping_rate'; rate: CartShippingRate }
  | { type: 'shipping_rate_missing' }
  | { type: 'payment_details_changed' }
  | { type: 'submit_payment' }

export function getPendingCheckoutPaymentSubmitAction({
  hasSelectedShippingRate,
  isCheckoutPending,
  isPaymentBusy,
  isPaymentReady,
  isPaymentSetupPending,
  isShippingPending,
  paymentStateKey,
  pendingPaymentShippingRate,
  pendingPaymentSubmitKey,
  shippingRates,
}: {
  hasSelectedShippingRate: boolean
  isCheckoutPending: boolean
  isPaymentBusy: boolean
  isPaymentReady: boolean
  isPaymentSetupPending: boolean
  isShippingPending: boolean
  paymentStateKey: string
  pendingPaymentShippingRate: CartShippingRate | null
  pendingPaymentSubmitKey: string | null
  shippingRates: CartShippingRate[]
}): PendingCheckoutPaymentSubmitAction {
  if (!pendingPaymentSubmitKey) {
    return { type: 'idle' }
  }

  if (!hasSelectedShippingRate) {
    if (
      !pendingPaymentShippingRate ||
      isShippingPending ||
      shippingRates.length === 0
    ) {
      return { type: 'wait' }
    }

    const nextRate = findMatchingCheckoutShippingRate({
      preferredRate: pendingPaymentShippingRate,
      rates: shippingRates,
    })

    if (!nextRate) {
      return { type: 'shipping_rate_missing' }
    }

    return {
      rate: nextRate,
      type: 'select_shipping_rate',
    }
  }

  if (
    paymentStateKey !== pendingPaymentSubmitKey ||
    isCheckoutPending ||
    isPaymentSetupPending ||
    isPaymentBusy
  ) {
    return { type: 'wait' }
  }

  if (!isPaymentReady) {
    return { type: 'payment_details_changed' }
  }

  return { type: 'submit_payment' }
}
