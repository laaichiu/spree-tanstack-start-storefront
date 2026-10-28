import { useCallback, useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CustomerAddress } from '@/lib/account/contracts'
import type {
  CheckoutOrder,
  CheckoutAddressInput,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../../i18n/messages'
import { checkoutAddressSchema } from '../../validation/address'
import { getCheckoutAddressSaveSkipReason } from '@/lib/checkout/contracts'

import {
  getCheckoutAddressFormDefaultsFromCustomerAddress,
  getCheckoutAddressSignature,
  getInitialSavedAddressSignature,
} from './checkout-form'
import { useCheckoutShippingAddressSave } from './use-checkout-shipping-address-save'
import type { CheckoutAddressFormSyncResult } from './use-checkout-address-form-dom-sync'

type CheckoutShippingAddressPersistenceOptions = {
  cart: CheckoutOrder
  market: MarketSelectionInput
  isCheckoutSubmitting: boolean
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  form: UseFormReturn<CheckoutAddressInput>
  handleSyncedDeliveryFields: (
    changedFields: Array<keyof CheckoutAddressInput>,
  ) => void
  initialShippingAddressValues: CheckoutAddressInput
  markShippingRatesCurrent: () => void
  markShippingRatesStale: () => void
  setCheckoutError: (error: string | null) => void
  t: (key: MessageKey) => string
  navigateToCheckout: (cartId: string) => Promise<void>
  setSelectedSavedAddressId: (addressId: string | null) => void
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
}

export function useCheckoutShippingAddressPersistence({
  cart,
  market,
  isCheckoutSubmitting,
  clearCheckoutSectionError,
  form,
  handleSyncedDeliveryFields,
  initialShippingAddressValues,
  markShippingRatesCurrent,
  markShippingRatesStale,
  setCheckoutError,
  t,
  navigateToCheckout,
  setSelectedSavedAddressId,
  syncDeliveryFormValuesFromDom,
}: CheckoutShippingAddressPersistenceOptions) {
  const { isAddressPending, saveShippingAddress } =
    useCheckoutShippingAddressSave({
      cart,
      market,
      t,
      navigateToCheckout,
      setCheckoutError,
    })
  const lastSavedAddressSignatureRef = useRef<string | null>(
    getInitialSavedAddressSignature(initialShippingAddressValues),
  )
  const lastAutoSaveAttemptSignatureRef = useRef<string | null>(null)
  const pendingAddressSaveSignatureRef = useRef<string | null>(null)
  const addressPersistenceGenerationRef = useRef(0)

  useEffect(() => {
    addressPersistenceGenerationRef.current += 1
    lastAutoSaveAttemptSignatureRef.current = null
    pendingAddressSaveSignatureRef.current = null
  }, [cart.id, market.country, market.locale])

  const persistCheckoutAddress = useCallback(
    async (
      address: CheckoutAddressInput,
      { force = false }: { force?: boolean } = {},
    ): Promise<CheckoutOrder | null | undefined> => {
      const addressPersistenceGeneration =
        addressPersistenceGenerationRef.current
      const signature = getCheckoutAddressSignature(address)
      const skipReason = getCheckoutAddressSaveSkipReason({
        force,
        lastAttemptSignature: lastAutoSaveAttemptSignatureRef.current,
        lastSavedSignature: lastSavedAddressSignatureRef.current,
        pendingSignature: pendingAddressSaveSignatureRef.current,
        signature,
      })

      if (skipReason === 'already_saved') {
        markShippingRatesCurrent()
        return undefined
      }

      if (skipReason) {
        return undefined
      }

      pendingAddressSaveSignatureRef.current = signature
      lastAutoSaveAttemptSignatureRef.current = signature
      setCheckoutError(null)
      clearCheckoutSectionError('address')
      try {
        const updatedCart = await saveShippingAddress(address)

        if (
          addressPersistenceGenerationRef.current !==
          addressPersistenceGeneration
        ) {
          return null
        }

        if (!updatedCart) {
          return null
        }

        lastSavedAddressSignatureRef.current = signature
        markShippingRatesCurrent()

        return updatedCart
      } finally {
        if (
          addressPersistenceGenerationRef.current ===
            addressPersistenceGeneration &&
          pendingAddressSaveSignatureRef.current === signature
        ) {
          pendingAddressSaveSignatureRef.current = null
        }
      }
    },
    [
      clearCheckoutSectionError,
      markShippingRatesCurrent,
      saveShippingAddress,
      setCheckoutError,
    ],
  )

  const persistCheckoutSavedAddress = useCallback(
    async (address: CustomerAddress) => {
      const addressPersistenceGeneration =
        addressPersistenceGenerationRef.current
      const nextAddressValues =
        getCheckoutAddressFormDefaultsFromCustomerAddress({
          address,
          email: form.getValues('email') || cart.email,
        })
      const signature = getCheckoutAddressSignature(nextAddressValues)

      form.reset(nextAddressValues)
      setSelectedSavedAddressId(address.id)
      markShippingRatesStale()
      pendingAddressSaveSignatureRef.current = signature
      lastAutoSaveAttemptSignatureRef.current = signature
      setCheckoutError(null)
      clearCheckoutSectionError('address')

      try {
        const updatedCart = await saveShippingAddress({
          email: nextAddressValues.email,
          shippingAddressId: address.id,
        })

        if (
          addressPersistenceGenerationRef.current !==
          addressPersistenceGeneration
        ) {
          return null
        }

        if (!updatedCart) {
          setSelectedSavedAddressId(null)
          return null
        }

        lastSavedAddressSignatureRef.current = signature
        markShippingRatesCurrent()

        return updatedCart
      } finally {
        if (
          addressPersistenceGenerationRef.current ===
            addressPersistenceGeneration &&
          pendingAddressSaveSignatureRef.current === signature
        ) {
          pendingAddressSaveSignatureRef.current = null
        }
      }
    },
    [
      cart.email,
      clearCheckoutSectionError,
      form,
      markShippingRatesCurrent,
      markShippingRatesStale,
      saveShippingAddress,
      setCheckoutError,
      setSelectedSavedAddressId,
    ],
  )

  const attemptAutoSaveAddress = useCallback(async () => {
    const { changedFields, values: formValues } = syncDeliveryFormValuesFromDom(
      {
        shouldValidate: true,
      },
    )

    handleSyncedDeliveryFields(changedFields)

    const result = checkoutAddressSchema.safeParse(formValues)

    if (!result.success || isAddressPending || isCheckoutSubmitting) {
      return
    }

    await persistCheckoutAddress(result.data)
  }, [
    handleSyncedDeliveryFields,
    isCheckoutSubmitting,
    isAddressPending,
    persistCheckoutAddress,
    syncDeliveryFormValuesFromDom,
  ])

  const handleSaveAddress = useCallback(
    async (address: CheckoutAddressInput) => {
      await persistCheckoutAddress(address, { force: true })
    },
    [persistCheckoutAddress],
  )

  const resetAddressPersistence = useCallback(() => {
    lastSavedAddressSignatureRef.current = getInitialSavedAddressSignature(
      initialShippingAddressValues,
    )
    lastAutoSaveAttemptSignatureRef.current = null
    pendingAddressSaveSignatureRef.current = null
  }, [initialShippingAddressValues])

  return {
    attemptAutoSaveAddress,
    handleSaveAddress,
    isAddressPending,
    persistCheckoutAddress,
    persistCheckoutSavedAddress,
    resetAddressPersistence,
  }
}
