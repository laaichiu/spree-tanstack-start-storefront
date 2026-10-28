import { useEffect } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'

import { readCheckoutMutationErrorMessage } from '../utils/checkout-error'

type CheckoutShippingRateEffectsOptions = {
  cart: CheckoutOrder
  hasCurrentShippingSelection: boolean
  isAddressPending: boolean
  isCheckoutSubmitting: boolean
  isShippingPending: boolean
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  markShippingRatesCurrent: () => void
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  resetShippingRatesStale: () => void
  selectedShippingRate: CartShippingRate | null
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
}

export function useCheckoutShippingRateEffects({
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
  resetShippingRatesStale,
  selectedShippingRate,
  selectShippingRate,
  setCheckoutError,
  setPendingPaymentSubmitKey,
  setSingleCheckoutSectionError,
  t,
}: CheckoutShippingRateEffectsOptions) {
  useEffect(() => {
    pendingPaymentShippingRateRef.current = null
    lastEnsuredShippingRateForPaymentKeyRef.current = null
    setPendingPaymentSubmitKey(null)
    resetShippingRatesStale()
  }, [
    cart.id,
    lastEnsuredShippingRateForPaymentKeyRef,
    market.country,
    market.locale,
    pendingPaymentShippingRateRef,
    resetShippingRatesStale,
    setPendingPaymentSubmitKey,
  ])

  useEffect(() => {
    if (
      !hasCurrentShippingSelection ||
      cart.amountDue === null ||
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
    let isCurrent = true

    void selectShippingRate(selectedShippingRate)
      .then(() => {
        if (!isCurrent) {
          return
        }

        markShippingRatesCurrent()
      })
      .catch((error) => {
        if (!isCurrent) {
          return
        }

        const message = readCheckoutMutationErrorMessage(
          error,
          t('checkout.shippingMethodSaveFailed'),
        )

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      })

    return () => {
      isCurrent = false
    }
  }, [
    cart.amountDue?.amount,
    cart.paymentMethods.length,
    hasCurrentShippingSelection,
    isAddressPending,
    isCheckoutSubmitting,
    isShippingPending,
    cart.id,
    lastEnsuredShippingRateForPaymentKeyRef,
    market.country,
    market.locale,
    markShippingRatesCurrent,
    paymentStateKey,
    selectedShippingRate,
    selectShippingRate,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  ])
}
