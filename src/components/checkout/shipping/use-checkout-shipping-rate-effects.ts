import { useEffect } from 'react'
import type { MutableRefObject, Dispatch, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { useMarket } from '@/components/layout/market-provider'

import type { CheckoutSectionErrorKey } from '../checkout-requirements'

type CheckoutShippingRateEffectsOptions = {
  cart: CheckoutOrder
  hasCurrentShippingSelection: boolean
  isAddressPending: boolean
  isCheckoutSubmitting: boolean
  isShippingPending: boolean
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  markShippingRatesCurrent: () => void
  resetShippingRatesStale: () => void
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  selectedShippingRate: CartShippingRate | null
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
}

export function useCheckoutShippingRateEffects({
  cart,
  hasCurrentShippingSelection,
  isAddressPending,
  isCheckoutSubmitting,
  isShippingPending,
  lastEnsuredShippingRateForPaymentKeyRef,
  markShippingRatesCurrent,
  paymentStateKey,
  pendingPaymentShippingRateRef,
  resetShippingRatesStale,
  selectedShippingRate,
  selectShippingRate,
  setCheckoutError,
  setPendingPaymentSubmitKey,
  setSingleCheckoutSectionError,
}: CheckoutShippingRateEffectsOptions) {
  const { t } = useMarket()

  useEffect(() => {
    pendingPaymentShippingRateRef.current = null
    lastEnsuredShippingRateForPaymentKeyRef.current = null
    setPendingPaymentSubmitKey(null)
    resetShippingRatesStale()
  }, [
    cart.id,
    lastEnsuredShippingRateForPaymentKeyRef,
    pendingPaymentShippingRateRef,
    resetShippingRatesStale,
    setPendingPaymentSubmitKey,
  ])

  useEffect(() => {
    if (
      !hasCurrentShippingSelection ||
      cart.amountDue.amount <= 0 ||
      cart.paymentMethods.length > 0 ||
      isAddressPending ||
      isCheckoutSubmitting ||
      isShippingPending
    ) {
      return
    }

    if (!selectedShippingRate) {
      return
    }

    if (lastEnsuredShippingRateForPaymentKeyRef.current === paymentStateKey) {
      return
    }

    lastEnsuredShippingRateForPaymentKeyRef.current = paymentStateKey

    void selectShippingRate(selectedShippingRate)
      .then(() => {
        markShippingRatesCurrent()
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : t('checkout.shippingMethodSaveFailed')

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      })
  }, [
    cart.amountDue.amount,
    cart.paymentMethods.length,
    hasCurrentShippingSelection,
    isAddressPending,
    isCheckoutSubmitting,
    isShippingPending,
    lastEnsuredShippingRateForPaymentKeyRef,
    markShippingRatesCurrent,
    paymentStateKey,
    selectedShippingRate,
    selectShippingRate,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  ])
}
