import type { UseFormReturn } from 'react-hook-form'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import { useCheckoutBillingAddressPersistence } from './use-checkout-billing-address-persistence'
import { useCheckoutShippingAddressPersistence } from './use-checkout-shipping-address-persistence'
import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form-dom-sync'

type CheckoutAddressPersistenceOptions = {
  cart: CheckoutOrder
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: 'same' | 'different'
  form: UseFormReturn<CheckoutAddressInput>
  initialShippingAddressValues: CheckoutAddressInput
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  handleSyncedDeliveryFields: (
    changedFields: Array<keyof CheckoutAddressInput>,
  ) => void
  markShippingRatesCurrent: () => void
  markShippingRatesStale: () => void
  scrollToCheckoutSection: (section: CheckoutSectionErrorKey) => void
  setSelectedSavedAddressId: (addressId: string | null) => void
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
}

export function useCheckoutAddressPersistence({
  cart,
  billingForm,
  billingMode,
  form,
  initialShippingAddressValues,
  handleSyncedBillingFields,
  handleSyncedDeliveryFields,
  markShippingRatesCurrent,
  markShippingRatesStale,
  scrollToCheckoutSection,
  setSelectedSavedAddressId,
  syncBillingFormValuesFromDom,
  syncDeliveryFormValuesFromDom,
  clearCheckoutSectionError,
  setCheckoutError,
  setSingleCheckoutSectionError,
}: CheckoutAddressPersistenceOptions) {
  const shipping = useCheckoutShippingAddressPersistence({
    cart,
    clearCheckoutSectionError,
    form,
    handleSyncedDeliveryFields,
    initialShippingAddressValues,
    markShippingRatesCurrent,
    markShippingRatesStale,
    setCheckoutError,
    setSelectedSavedAddressId,
    syncDeliveryFormValuesFromDom,
  })
  const billing = useCheckoutBillingAddressPersistence({
    billingForm,
    billingMode,
    cart,
    clearCheckoutSectionError,
    handleSyncedBillingFields,
    scrollToCheckoutSection,
    setCheckoutError,
    setSingleCheckoutSectionError,
    syncBillingFormValuesFromDom,
  })

  return {
    ...shipping,
    ...billing,
  }
}
