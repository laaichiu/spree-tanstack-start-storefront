import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutOrder,
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../../i18n/messages'

import { useCheckoutBillingAddressPersistence } from './use-checkout-billing-address-persistence'
import { useCheckoutShippingAddressPersistence } from './use-checkout-shipping-address-persistence'
import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form-dom-sync'

type CheckoutAddressPersistenceOptions = {
  cart: CheckoutOrder
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: CheckoutBillingAddressMode
  form: UseFormReturn<CheckoutAddressInput>
  market: MarketSelectionInput
  isCheckoutSubmitting: boolean
  initialShippingAddressValues: CheckoutAddressInput
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  handleSyncedDeliveryFields: (
    changedFields: Array<keyof CheckoutAddressInput>,
  ) => void
  markShippingRatesCurrent: () => void
  markShippingRatesStale: () => void
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
  setSelectedSavedAddressId: (addressId: string | null) => void
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
  navigateToCheckout: (cartId: string) => Promise<void>
}

export function useCheckoutAddressPersistence({
  cart,
  billingForm,
  billingMode,
  form,
  market,
  isCheckoutSubmitting,
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
  t,
  navigateToCheckout,
}: CheckoutAddressPersistenceOptions) {
  const shipping = useCheckoutShippingAddressPersistence({
    cart,
    market,
    clearCheckoutSectionError,
    form,
    handleSyncedDeliveryFields,
    initialShippingAddressValues,
    isCheckoutSubmitting,
    markShippingRatesCurrent,
    markShippingRatesStale,
    setCheckoutError,
    setSelectedSavedAddressId,
    syncDeliveryFormValuesFromDom,
    t,
    navigateToCheckout,
  })
  const billing = useCheckoutBillingAddressPersistence({
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
  })

  return {
    ...shipping,
    ...billing,
  }
}
