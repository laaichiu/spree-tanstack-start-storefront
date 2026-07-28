import { useCallback } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { CheckoutBillingAddressInput } from '@/lib/checkout/validation/address'
import { checkoutBillingAddressSchema } from '@/lib/checkout/validation/address'

import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import type { CheckoutBillingAddressFormSyncResult } from './use-checkout-address-form-dom-sync'
import { useUpdateCheckoutBillingAddress } from './use-checkout-address'

type CheckoutBillingAddressPersistenceOptions = {
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: 'same' | 'different'
  cart: CheckoutOrder
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  scrollToCheckoutSection: (section: CheckoutSectionErrorKey) => void
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
}

export function useCheckoutBillingAddressPersistence({
  billingForm,
  billingMode,
  cart,
  clearCheckoutSectionError,
  handleSyncedBillingFields,
  scrollToCheckoutSection,
  setCheckoutError,
  setSingleCheckoutSectionError,
  syncBillingFormValuesFromDom,
}: CheckoutBillingAddressPersistenceOptions) {
  const { t } = useMarket()
  const updateCheckoutBillingAddress = useUpdateCheckoutBillingAddress({
    cartId: cart.id,
    syncOnSuccess: false,
  })

  const persistBillingAddress = useCallback(
    async (
      currentCart: CheckoutOrder = cart,
    ): Promise<CheckoutOrder | null> => {
      if (billingMode === 'same') {
        if (currentCart.shippingMatchesBillingAddress) {
          return currentCart
        }

        try {
          clearCheckoutSectionError('payment')
          return await updateCheckoutBillingAddress.mutateAsync({
            useShipping: true,
          })
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : t('checkout.billingSaveFailed')

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
        scrollToCheckoutSection('payment')

        return null
      }

      try {
        clearCheckoutSectionError('payment')
        return await updateCheckoutBillingAddress.mutateAsync({
          billingAddress: parsedBillingAddress.data,
          useShipping: false,
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t('checkout.billingSaveFailed')

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
      updateCheckoutBillingAddress,
    ],
  )

  return {
    isBillingPending: updateCheckoutBillingAddress.isPending,
    persistBillingAddress,
  }
}
