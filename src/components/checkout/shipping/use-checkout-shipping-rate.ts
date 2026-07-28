import { useCallback, useState } from 'react'
import type { MutableRefObject, Dispatch, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import { useCheckoutShippingRateEffects } from './use-checkout-shipping-rate-effects'
import { useCheckoutShippingRateSelection } from './use-checkout-shipping-rate-selection'

export type { EnsureCheckoutShippingRate } from './use-checkout-shipping-rate-selection'

type CheckoutShippingRateOptions = {
  cart: CheckoutOrder
  isAddressComplete: boolean
  isAddressPending: boolean
  isCheckoutSubmitting: boolean
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
}

export function useCheckoutShippingRate({
  cart,
  isAddressComplete,
  isAddressPending,
  isCheckoutSubmitting,
  paymentStateKey,
  pendingPaymentShippingRateRef,
  lastEnsuredShippingRateForPaymentKeyRef,
  setPendingPaymentSubmitKey,
  clearCheckoutSectionError,
  setCheckoutError,
  setSingleCheckoutSectionError,
}: CheckoutShippingRateOptions) {
  const [areShippingRatesStale, setAreShippingRatesStale] = useState(false)
  const markShippingRatesStale = useCallback(() => {
    setAreShippingRatesStale(true)
    clearCheckoutSectionError('shipping')
    pendingPaymentShippingRateRef.current = null
    lastEnsuredShippingRateForPaymentKeyRef.current = null
    setPendingPaymentSubmitKey(null)
  }, [
    clearCheckoutSectionError,
    lastEnsuredShippingRateForPaymentKeyRef,
    pendingPaymentShippingRateRef,
    setPendingPaymentSubmitKey,
  ])

  const markShippingRatesCurrent = useCallback(() => {
    setAreShippingRatesStale(false)
  }, [])
  const selection = useCheckoutShippingRateSelection({
    areShippingRatesStale,
    cart,
    isAddressComplete,
    isAddressPending,
    clearCheckoutSectionError,
    markShippingRatesCurrent,
    pendingPaymentShippingRateRef,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
  })
  const {
    ensureSelectedCheckoutShippingRate,
    handleSelectShippingRate,
    hasSelectedShippingRate,
    isShippingPending,
    selectShippingRate,
    selectedShippingRate,
    selectedShippingRateId,
    shippingMethodPlaceholder,
  } = selection
  const hasCurrentShippingSelection =
    hasSelectedShippingRate && !areShippingRatesStale
  const areShippingMethodsUpdating =
    isAddressPending || isShippingPending || areShippingRatesStale

  useCheckoutShippingRateEffects({
    cart,
    hasCurrentShippingSelection,
    isAddressPending,
    isCheckoutSubmitting,
    isShippingPending,
    lastEnsuredShippingRateForPaymentKeyRef,
    markShippingRatesCurrent,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    resetShippingRatesStale: markShippingRatesCurrent,
    selectedShippingRate,
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
  })

  return {
    areShippingMethodsUpdating,
    areShippingRatesStale,
    ensureSelectedCheckoutShippingRate,
    handleSelectShippingRate,
    hasCurrentShippingSelection,
    hasSelectedShippingRate,
    isShippingPending,
    markShippingRatesCurrent,
    markShippingRatesStale,
    selectedShippingRate,
    selectedShippingRateId,
    selectShippingRate,
    shippingMethodPlaceholder,
  }
}
