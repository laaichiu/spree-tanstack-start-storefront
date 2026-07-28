import { describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'

import { runCheckoutSubmitFlow } from './checkout-submit-flow'
import type { CheckoutPaymentSubmitRefreshAction } from '../payment/checkout-payment-submit-refresh'

function shippingRate(): CartShippingRate {
  return {
    deliveryMethodId: 'delivery-method-1',
    displayPrice: { amount: 5, currencyCode: 'USD' },
    fulfillmentId: 'fulfillment-1',
    id: 'rate-1',
    name: 'Ground',
    price: { amount: 5, currencyCode: 'USD' },
    selected: true,
  }
}

function ready(refreshAction: CheckoutPaymentSubmitRefreshAction) {
  return {
    refreshAction,
    type: 'ready' as const,
  }
}

function options() {
  const preparePaymentSubmission = vi.fn()
  const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
  const pendingPaymentShippingRateRef = {
    current: null as CartShippingRate | null,
  }
  const setPendingPaymentSubmitKey = vi.fn()
  const setCheckoutError = vi.fn()
  const submitRenderedPayment = vi.fn().mockResolvedValue(undefined)

  return {
    navigateToCheckout,
    pendingPaymentShippingRateRef,
    preparePaymentSubmission,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    submitRenderedPayment,
  }
}

describe('runCheckoutSubmitFlow', () => {
  it('stops when preparation reports invalid form data', async () => {
    const current = options()
    current.preparePaymentSubmission.mockResolvedValue({ type: 'invalid' })

    await runCheckoutSubmitFlow(current)

    expect(current.navigateToCheckout).not.toHaveBeenCalled()
    expect(current.submitRenderedPayment).not.toHaveBeenCalled()
  })

  it('navigates when preparation returns a replacement checkout cart', async () => {
    const current = options()
    current.preparePaymentSubmission.mockResolvedValue(
      ready({
        cartId: 'cart_456',
        type: 'navigate_checkout',
      }),
    )

    await runCheckoutSubmitFlow(current)

    expect(current.navigateToCheckout).toHaveBeenCalledWith('cart_456')
    expect(current.submitRenderedPayment).not.toHaveBeenCalled()
  })

  it('queues payment when preparation refreshes payment state', async () => {
    const current = options()
    const rate = shippingRate()
    current.preparePaymentSubmission.mockResolvedValue(
      ready({
        paymentStateKey: 'cart_123:next',
        shippingRate: rate,
        type: 'queue_payment_submit',
      }),
    )

    await runCheckoutSubmitFlow(current)

    expect(current.pendingPaymentShippingRateRef.current).toBe(rate)
    expect(current.setPendingPaymentSubmitKey).toHaveBeenCalledWith(
      'cart_123:next',
    )
    expect(current.setCheckoutError).toHaveBeenCalledWith(null)
    expect(current.submitRenderedPayment).not.toHaveBeenCalled()
  })

  it('submits the rendered payment when preparation is already current', async () => {
    const current = options()
    current.preparePaymentSubmission.mockResolvedValue(
      ready({ type: 'submit_payment' }),
    )

    await runCheckoutSubmitFlow(current)

    expect(current.submitRenderedPayment).toHaveBeenCalledOnce()
    expect(current.navigateToCheckout).not.toHaveBeenCalled()
  })
})
