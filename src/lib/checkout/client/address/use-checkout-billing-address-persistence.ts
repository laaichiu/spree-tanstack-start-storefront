import { useCallback, useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutOrder,
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../../i18n/messages'
import { readCheckoutMutationErrorMessage } from '../../utils/checkout-error'
import { checkoutBillingAddressSchema } from '../../validation/address'
import { useUpdateCheckoutBillingAddress } from '../use-checkout-address'

import type { CheckoutBillingAddressFormSyncResult } from './use-checkout-address-form-dom-sync'

type CheckoutBillingAddressPersistenceOptions = {
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: CheckoutBillingAddressMode
  cart: CheckoutOrder
  market: MarketSelectionInput
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  t: (key: MessageKey) => string
}

export function useCheckoutBillingAddressPersistence({
  billingForm,
  billingMode,
  cart,
  market,
  clearCheckoutSectionError,
  handleSyncedBillingFields,
  scrollToCheckoutSection,
  setCheckoutError,
  setSingleCheckoutSectionError,
  syncBillingFormValuesFromDom,
  t,
}: CheckoutBillingAddressPersistenceOptions) {
  const {
    isPending: isBillingPending,
    mutateAsync: updateBillingAddressAsync,
  } = useUpdateCheckoutBillingAddress({
    cartId: cart.id,
    market,
    syncOnSuccess: false,
  })
  const billingPersistenceGenerationRef = useRef(0)

  useEffect(() => {
    billingPersistenceGenerationRef.current += 1

    return () => {
      billingPersistenceGenerationRef.current += 1
    }
  }, [cart.id, market.country, market.locale])

  const persistBillingAddress = useCallback(
    async (
      currentCart: CheckoutOrder = cart,
    ): Promise<CheckoutOrder | null> => {
      const billingPersistenceGeneration =
        billingPersistenceGenerationRef.current

      if (billingMode === 'same') {
        if (currentCart.shippingMatchesBillingAddress) {
          return currentCart
        }

        try {
          clearCheckoutSectionError('payment')
          const updatedCart = await updateBillingAddressAsync({
            useShipping: true,
          })

          if (
            billingPersistenceGenerationRef.current !==
            billingPersistenceGeneration
          ) {
            return null
          }

          return updatedCart
        } catch (error) {
          if (
            billingPersistenceGenerationRef.current !==
            billingPersistenceGeneration
          ) {
            return null
          }

          const message = readCheckoutMutationErrorMessage(
            error,
            t('checkout.billingSaveFailed'),
          )

          setCheckoutError(message)
          setSingleCheckoutSectionError('payment', message)

          return null
        }
      }

      const { changedFields, values: billingValues } =
        syncBillingFormValuesFromDom({
          shouldValidate: true,
        })

      handleSyncedBillingFields(changedFields)

      const parsedBillingAddress =
        checkoutBillingAddressSchema.safeParse(billingValues)

      if (!parsedBillingAddress.success) {
        await billingForm.trigger()

        if (
          billingPersistenceGenerationRef.current !==
          billingPersistenceGeneration
        ) {
          return null
        }

        scrollToCheckoutSection('payment')

        return null
      }

      try {
        clearCheckoutSectionError('payment')
        const updatedCart = await updateBillingAddressAsync({
          billingAddress: parsedBillingAddress.data,
          useShipping: false,
        })

        if (
          billingPersistenceGenerationRef.current !==
          billingPersistenceGeneration
        ) {
          return null
        }

        return updatedCart
      } catch (error) {
        if (
          billingPersistenceGenerationRef.current !==
          billingPersistenceGeneration
        ) {
          return null
        }

        const message = readCheckoutMutationErrorMessage(
          error,
          t('checkout.billingSaveFailed'),
        )

        setCheckoutError(message)
        setSingleCheckoutSectionError('payment', message)

        return null
      }
    },
    [
      billingForm,
      billingMode,
      cart,
      clearCheckoutSectionError,
      handleSyncedBillingFields,
      scrollToCheckoutSection,
      setCheckoutError,
      setSingleCheckoutSectionError,
      syncBillingFormValuesFromDom,
      t,
      updateBillingAddressAsync,
    ],
  )

  return {
    isBillingPending,
    persistBillingAddress,
  }
}
