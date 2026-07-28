import type { RefObject } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import type { BillingAddressMode } from './checkout-form'
import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import { useCheckoutAddressFormDomSync } from './use-checkout-address-form-dom-sync'
import { useCheckoutAddressFormEvents } from './use-checkout-address-form-events'

export type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form-dom-sync'

type CheckoutAddressFormSyncOptions = {
  form: UseFormReturn<CheckoutAddressInput>
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: BillingAddressMode
  billingFieldsRef: RefObject<HTMLDivElement | null>
  deliveryFormRef: RefObject<HTMLFormElement | null>
  selectedSavedAddressId: string | null
  setSelectedSavedAddressId: (addressId: string | null) => void
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  markShippingRatesStale: () => void
  scheduleAutoSaveAddress: () => void
  handleAddressBlur: () => void
}

export function useCheckoutAddressFormSync({
  form,
  billingForm,
  billingMode,
  billingFieldsRef,
  deliveryFormRef,
  selectedSavedAddressId,
  setSelectedSavedAddressId,
  clearCheckoutSectionError,
  markShippingRatesStale,
  scheduleAutoSaveAddress,
  handleAddressBlur,
}: CheckoutAddressFormSyncOptions) {
  const domSync = useCheckoutAddressFormDomSync({
    billingFieldsRef,
    billingForm,
    deliveryFormRef,
    form,
  })
  const events = useCheckoutAddressFormEvents({
    billingForm,
    billingMode,
    clearCheckoutSectionError,
    form,
    handleAddressBlur,
    markShippingRatesStale,
    scheduleAutoSaveAddress,
    selectedSavedAddressId,
    setSelectedSavedAddressId,
    syncBillingFormValuesFromDom: domSync.syncBillingFormValuesFromDom,
    syncDeliveryFormValuesFromDom: domSync.syncDeliveryFormValuesFromDom,
  })

  return {
    ...domSync,
    ...events,
  }
}
