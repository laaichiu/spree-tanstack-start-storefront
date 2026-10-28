import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../../i18n/messages'
import { getCheckoutShippingAddressMutationKey } from '../checkout-mutation'
import { readCheckoutMutationErrorMessage } from '../../utils/checkout-error'

import { useUpdateCheckoutAddress } from '../use-checkout-address'
import type { CheckoutAddressUpdateInput } from '../use-checkout-address'

function hasPendingShippingAddressMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationKey: ReturnType<typeof getCheckoutShippingAddressMutationKey>,
) {
  return queryClient
    .getMutationCache()
    .findAll({ exact: true, mutationKey })
    .some((mutation) => mutation.state.status === 'pending')
}

export function useCheckoutShippingAddressSave({
  cart,
  market,
  t,
  navigateToCheckout,
  setCheckoutError,
}: {
  cart: CheckoutOrder
  market: MarketSelectionInput
  t: (key: MessageKey) => string
  navigateToCheckout: (cartId: string) => Promise<void>
  setCheckoutError: (error: string | null) => void
}) {
  const queryClient = useQueryClient()
  const { isPending: isAddressPending, mutateAsync: saveCheckoutAddressAsync } =
    useUpdateCheckoutAddress({
      cartId: cart.id,
      market,
    })
  const shippingAddressMutationKey = getCheckoutShippingAddressMutationKey({
    cartId: cart.id,
    market,
  })
  const saveAddressInFlightRef = useRef(false)
  const saveAddressGenerationRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    saveAddressGenerationRef.current += 1
    saveAddressInFlightRef.current = false
  }, [cart.id, market.country, market.locale])

  const saveShippingAddress = useCallback(
    async (
      input: CheckoutAddressUpdateInput,
    ): Promise<CheckoutOrder | null> => {
      const saveAddressGeneration = saveAddressGenerationRef.current
      const isCurrentSave = () =>
        isMountedRef.current &&
        saveAddressGenerationRef.current === saveAddressGeneration

      if (
        saveAddressInFlightRef.current ||
        isAddressPending ||
        hasPendingShippingAddressMutation(
          queryClient,
          shippingAddressMutationKey,
        )
      ) {
        return null
      }

      saveAddressInFlightRef.current = true

      try {
        const updatedCart = await saveCheckoutAddressAsync(input)

        if (!isCurrentSave()) {
          return null
        }

        if (updatedCart.id !== cart.id) {
          try {
            await navigateToCheckout(updatedCart.id)
          } catch (navigationError) {
            if (!isCurrentSave()) {
              return null
            }

            setCheckoutError(
              readCheckoutMutationErrorMessage(
                navigationError,
                t('checkout.deliverySaveFailed'),
              ),
            )
          }
        }

        return updatedCart
      } catch (error) {
        if (!isCurrentSave()) {
          return null
        }

        setCheckoutError(
          readCheckoutMutationErrorMessage(
            error,
            t('checkout.deliverySaveFailed'),
          ),
        )

        return null
      } finally {
        if (
          isMountedRef.current &&
          saveAddressGenerationRef.current === saveAddressGeneration
        ) {
          saveAddressInFlightRef.current = false
        }
      }
    },
    [
      cart.id,
      isAddressPending,
      navigateToCheckout,
      queryClient,
      setCheckoutError,
      shippingAddressMutationKey,
      t,
      saveCheckoutAddressAsync,
    ],
  )

  return {
    isAddressPending,
    saveShippingAddress,
  }
}
