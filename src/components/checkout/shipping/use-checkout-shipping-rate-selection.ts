import { useCallback } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { getCheckoutShippingMethodPlaceholderKey } from '@/lib/checkout/utils/shipping/shipping-method-placeholder'
import {
  findMatchingCheckoutShippingRate,
  getSelectedCheckoutShippingRate,
} from '@/lib/checkout/utils/shipping/shipping-rate-selection'

import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import { useSelectCheckoutShippingRate } from '../address/use-checkout-address'

export type EnsureCheckoutShippingRate = (
  order: CheckoutOrder,
  preferredRate: CartShippingRate | null,
) => Promise<CheckoutOrder | null>

type CheckoutShippingRateSelectionOptions = {
  areShippingRatesStale: boolean
  cart: CheckoutOrder
  isAddressComplete: boolean
  isAddressPending: boolean
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  markShippingRatesCurrent: () => void
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
}

export function useCheckoutShippingRateSelection({
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
}: CheckoutShippingRateSelectionOptions) {
  const { t } = useMarket()
  const selectCheckoutShippingRate = useSelectCheckoutShippingRate({
    cartId: cart.id,
  })
  const isShippingPending = selectCheckoutShippingRate.isPending
  const selectedShippingRate = getSelectedCheckoutShippingRate(cart)
  const selectedShippingRateId = selectedShippingRate?.id ?? ''
  const hasSelectedShippingRate = Boolean(selectedShippingRateId)
  const shippingMethodPlaceholder = t(
    getCheckoutShippingMethodPlaceholderKey({
      areShippingRatesStale,
      isAddressComplete,
      isAddressPending,
      isShippingPending,
    }),
  )

  const selectShippingRate = useCallback(
    (rate: CartShippingRate) =>
      selectCheckoutShippingRate.mutateAsync({
        deliveryRateId: rate.id,
        fulfillmentId: rate.fulfillmentId,
      }),
    [selectCheckoutShippingRate],
  )

  const handleSelectShippingRate = useCallback(
    async (rate: CartShippingRate) => {
      if (isShippingPending) {
        return
      }

      setCheckoutError(null)
      clearCheckoutSectionError('shipping')
      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)

      try {
        await selectShippingRate(rate)
        markShippingRatesCurrent()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t('checkout.shippingMethodSaveFailed')

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      }
    },
    [
      clearCheckoutSectionError,
      isShippingPending,
      markShippingRatesCurrent,
      pendingPaymentShippingRateRef,
      selectShippingRate,
      setCheckoutError,
      setPendingPaymentSubmitKey,
      setSingleCheckoutSectionError,
      t,
    ],
  )

  const ensureSelectedCheckoutShippingRate =
    useCallback<EnsureCheckoutShippingRate>(
      async (order, preferredRate) => {
        const selectedRate = getSelectedCheckoutShippingRate(order)
        const nextRate =
          findMatchingCheckoutShippingRate({
            preferredRate: preferredRate ?? selectedRate,
            rates: order.shippingRates,
          }) ?? selectedRate

        if (!nextRate) {
          return null
        }

        return selectShippingRate(nextRate)
      },
      [selectShippingRate],
    )

  return {
    ensureSelectedCheckoutShippingRate,
    handleSelectShippingRate,
    hasSelectedShippingRate,
    isShippingPending,
    selectShippingRate,
    selectedShippingRate,
    selectedShippingRateId,
    shippingMethodPlaceholder,
  }
}
