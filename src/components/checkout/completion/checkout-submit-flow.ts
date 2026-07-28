import type { CartShippingRate } from '@/lib/cart/model/cart'

import type { CheckoutSubmitPreparationResult } from './checkout-submit-preparation-flow'

type CheckoutSubmitFlowOptions = {
  preparePaymentSubmission: () => Promise<CheckoutSubmitPreparationResult>
  navigateToCheckout: (cartId: string) => Promise<void>
  pendingPaymentShippingRateRef: {
    current: CartShippingRate | null
  }
  setPendingPaymentSubmitKey: (key: string | null) => void
  setCheckoutError: (error: string | null) => void
  submitRenderedPayment: () => Promise<void>
}

export async function runCheckoutSubmitFlow({
  preparePaymentSubmission,
  navigateToCheckout,
  pendingPaymentShippingRateRef,
  setPendingPaymentSubmitKey,
  setCheckoutError,
  submitRenderedPayment,
}: CheckoutSubmitFlowOptions) {
  const preparation = await preparePaymentSubmission()

  if (preparation.type === 'invalid' || preparation.type === 'abort') {
    return
  }

  const submitRefreshAction = preparation.refreshAction

  if (submitRefreshAction.type === 'navigate_checkout') {
    await navigateToCheckout(submitRefreshAction.cartId)
    return
  }

  if (submitRefreshAction.type === 'queue_payment_submit') {
    pendingPaymentShippingRateRef.current = submitRefreshAction.shippingRate
    setPendingPaymentSubmitKey(submitRefreshAction.paymentStateKey)
    setCheckoutError(null)
    return
  }

  await submitRenderedPayment()
}
