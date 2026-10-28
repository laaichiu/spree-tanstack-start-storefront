import { useCallback, useState } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'

import { useCheckoutShippingRateEffects } from './use-checkout-shipping-rate-effects'
import { useCheckoutShippingRateSelection } from './use-checkout-shipping-rate-selection'
import type { EnsureCheckoutShippingRate } from './use-checkout-shipping-rate-selection'

export type { EnsureCheckoutShippingRate }

type CheckoutShippingRateOptions = {
  cart: CheckoutOrder
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  isAddressComplete: boolean
  isAddressPending: boolean
  isCheckoutSubmitting: boolean
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  market: MarketSelectionInput
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
}

export function useCheckoutShippingRate({
  cart,
  clearCheckoutSectionError,
  isAddressComplete,
  isAddressPending,
  isCheckoutSubmitting,
  lastEnsuredShippingRateForPaymentKeyRef,
  market,
  paymentStateKey,
  pendingPaymentShippingRateRef,
  setCheckoutError,
  setPendingPaymentSubmitKey,
  setSingleCheckoutSectionError,
  t,
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
    clearCheckoutSectionError,
    isAddressComplete,
    isAddressPending,
    market,
    markShippingRatesCurrent,
    pendingPaymentShippingRateRef,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    t,
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
    market,
    markShippingRatesCurrent,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    resetShippingRatesStale: markShippingRatesCurrent,
    selectedShippingRate,
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    t,
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
