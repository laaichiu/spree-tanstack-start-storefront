import type { CartShippingRate } from '@/lib/cart/contracts'

import type { CheckoutSubmitPreparationResult } from './checkout-submit-preparation'

type CheckoutSubmitFlowOptions = {
  preparePaymentSubmission: (
    isCurrent: () => boolean,
  ) => Promise<CheckoutSubmitPreparationResult>
  navigateToCheckout: (cartId: string) => Promise<void>
  pendingPaymentShippingRateRef: {
    current: CartShippingRate | null
  }
  setPendingPaymentSubmitKey: (key: string | null) => void
  setCheckoutError: (error: string | null) => void
  submitRenderedPayment: () => Promise<void>
  isCurrent?: () => boolean
}

export async function runCheckoutSubmitFlow({
  preparePaymentSubmission,
  navigateToCheckout,
  pendingPaymentShippingRateRef,
  setPendingPaymentSubmitKey,
  setCheckoutError,
  submitRenderedPayment,
  isCurrent = () => true,
}: CheckoutSubmitFlowOptions) {
  const preparation = await preparePaymentSubmission(isCurrent)

  if (!isCurrent()) {
    return
  }

  if (preparation.type === 'invalid' || preparation.type === 'abort') {
    return
  }

  const submitRefreshAction = preparation.refreshAction

  if (submitRefreshAction.type === 'navigate_checkout') {
    if (!isCurrent()) {
      return
    }

    await navigateToCheckout(submitRefreshAction.cartId)
    return
  }

  if (submitRefreshAction.type === 'queue_payment_submit') {
    if (!isCurrent()) {
      return
    }

    pendingPaymentShippingRateRef.current = submitRefreshAction.shippingRate
    setPendingPaymentSubmitKey(submitRefreshAction.paymentStateKey)
    setCheckoutError(null)
    return
  }

  if (!isCurrent()) {
    return
  }

  await submitRenderedPayment()
}
