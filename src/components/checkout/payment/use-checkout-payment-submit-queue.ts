import { useEffect } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import { getPendingCheckoutPaymentSubmitAction } from '@/lib/checkout/utils/payment/payment-submit-queue'

type CheckoutPaymentSubmitQueueOptions = {
  cart: CheckoutOrder
  hasSelectedShippingRate: boolean
  isCheckoutPending: boolean
  isPaymentBusy: boolean
  isPaymentReady: boolean
  isPaymentSetupPending: boolean
  isShippingPending: boolean
  paymentStateKey: string
  pendingPaymentSubmitKey: string | null
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
  submitRenderedPayment: () => Promise<void>
}

export function useCheckoutPaymentSubmitQueue({
  cart,
  hasSelectedShippingRate,
  isCheckoutPending,
  isPaymentBusy,
  isPaymentReady,
  isPaymentSetupPending,
  isShippingPending,
  paymentStateKey,
  pendingPaymentSubmitKey,
  pendingPaymentShippingRateRef,
  setPendingPaymentSubmitKey,
  selectShippingRate,
  setCheckoutError,
  setSingleCheckoutSectionError,
  submitRenderedPayment,
}: CheckoutPaymentSubmitQueueOptions) {
  const { t } = useMarket()

  useEffect(() => {
    const action = getPendingCheckoutPaymentSubmitAction({
      hasSelectedShippingRate,
      isCheckoutPending,
      isPaymentBusy,
      isPaymentReady,
      isPaymentSetupPending,
      isShippingPending,
      paymentStateKey,
      pendingPaymentShippingRate: pendingPaymentShippingRateRef.current,
      pendingPaymentSubmitKey,
      shippingRates: cart.shippingRates,
    })

    if (action.type === 'idle' || action.type === 'wait') {
      return
    }

    if (action.type === 'select_shipping_rate') {
      void selectShippingRate(action.rate).catch((error) => {
        pendingPaymentShippingRateRef.current = null
        setPendingPaymentSubmitKey(null)
        const message =
          error instanceof Error
            ? error.message
            : t('checkout.shippingMethodSaveFailed')

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      })

      return
    }

    if (action.type === 'shipping_rate_missing') {
      const message = t('checkout.selectShippingBeforePayment')

      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      setCheckoutError(message)
      setSingleCheckoutSectionError('shipping', message)
      return
    }

    if (action.type === 'payment_details_changed') {
      const message = t('checkout.paymentDetailsChanged')

      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      setCheckoutError(message)
      setSingleCheckoutSectionError('payment', message)
      return
    }

    pendingPaymentShippingRateRef.current = null
    setPendingPaymentSubmitKey(null)
    void submitRenderedPayment()
  }, [
    cart.shippingRates,
    hasSelectedShippingRate,
    isCheckoutPending,
    isPaymentBusy,
    isPaymentReady,
    isPaymentSetupPending,
    isShippingPending,
    paymentStateKey,
    pendingPaymentSubmitKey,
    pendingPaymentShippingRateRef,
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    submitRenderedPayment,
    t,
  ])
}
