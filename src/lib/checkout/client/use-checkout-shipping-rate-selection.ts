import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { CartShippingRate } from '@/lib/cart/contracts'
import {
  findMatchingCheckoutShippingRate,
  getSelectedCheckoutShippingRate,
} from '@/lib/checkout/contracts'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'

import { readCheckoutMutationErrorMessage } from '../utils/checkout-error'
import { getCheckoutShippingMethodPlaceholderKey } from '../utils/shipping/shipping-method-placeholder'
import { getCheckoutShippingRateMutationKey } from './checkout-mutation'
import { useSelectCheckoutShippingRate } from './use-checkout-address'

export type EnsureCheckoutShippingRate = (
  order: CheckoutOrder,
  preferredRate: CartShippingRate | null,
) => Promise<CheckoutOrder | null>

type CheckoutShippingRateSelectionOptions = {
  areShippingRatesStale: boolean
  cart: CheckoutOrder
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  isAddressComplete: boolean
  isAddressPending: boolean
  market: MarketSelectionInput
  markShippingRatesCurrent: () => void
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
}

function hasPendingShippingRateMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationKey: ReturnType<typeof getCheckoutShippingRateMutationKey>,
) {
  return queryClient
    .getMutationCache()
    .findAll({ exact: true, mutationKey })
    .some((mutation) => mutation.state.status === 'pending')
}

export function useCheckoutShippingRateSelection({
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
}: CheckoutShippingRateSelectionOptions) {
  const queryClient = useQueryClient()
  const { isPending: isShippingPending, mutateAsync: selectShippingRateAsync } =
    useSelectCheckoutShippingRate({
      cartId: cart.id,
      market,
    })
  const shippingRateMutationKey = getCheckoutShippingRateMutationKey({
    cartId: cart.id,
    market,
  })
  const manualSelectionInFlightRef = useRef(false)
  const manualSelectionGenerationRef = useRef(0)
  const isMountedRef = useRef<boolean | undefined>(undefined)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    manualSelectionGenerationRef.current += 1
    manualSelectionInFlightRef.current = false
  }, [cart.id, market.country, market.locale])
  const isMounted = useCallback(() => Boolean(isMountedRef.current), [])
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
      selectShippingRateAsync({
        deliveryRateId: rate.id,
        fulfillmentId: rate.fulfillmentId,
      }),
    [selectShippingRateAsync],
  )

  const handleSelectShippingRate = useCallback(
    async (rate: CartShippingRate) => {
      const selectionGeneration = manualSelectionGenerationRef.current

      if (
        !isMounted() ||
        isShippingPending ||
        manualSelectionInFlightRef.current ||
        hasPendingShippingRateMutation(queryClient, shippingRateMutationKey)
      ) {
        return
      }

      manualSelectionInFlightRef.current = true
      setCheckoutError(null)
      clearCheckoutSectionError('shipping')
      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)

      try {
        await selectShippingRate(rate)

        if (
          !isMounted() ||
          selectionGeneration !== manualSelectionGenerationRef.current
        ) {
          return
        }

        markShippingRatesCurrent()
      } catch (error) {
        if (
          !isMounted() ||
          selectionGeneration !== manualSelectionGenerationRef.current
        ) {
          return
        }

        const message = readCheckoutMutationErrorMessage(
          error,
          t('checkout.shippingMethodSaveFailed'),
        )

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      } finally {
        if (
          isMounted() &&
          selectionGeneration === manualSelectionGenerationRef.current
        ) {
          manualSelectionInFlightRef.current = false
        }
      }
    },
    [
      clearCheckoutSectionError,
      isMounted,
      isShippingPending,
      markShippingRatesCurrent,
      manualSelectionInFlightRef,
      pendingPaymentShippingRateRef,
      queryClient,
      selectShippingRate,
      setCheckoutError,
      setPendingPaymentSubmitKey,
      setSingleCheckoutSectionError,
      shippingRateMutationKey,
      t,
    ],
  )

  const ensureSelectedCheckoutShippingRate =
    useCallback<EnsureCheckoutShippingRate>(
      async (order, preferredRate) => {
        const selectionGeneration = manualSelectionGenerationRef.current

        if (!isMounted()) {
          return null
        }

        const selectedRate = getSelectedCheckoutShippingRate(order)
        const nextRate =
          findMatchingCheckoutShippingRate({
            preferredRate: preferredRate ?? selectedRate,
            rates: order.shippingRates,
          }) ?? selectedRate

        if (!nextRate) {
          return null
        }

        const updatedOrder = await selectShippingRate(nextRate)

        if (
          !isMounted() ||
          selectionGeneration !== manualSelectionGenerationRef.current
        ) {
          return null
        }

        return updatedOrder
      },
      [isMounted, selectShippingRate],
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
