import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { useCheckoutAddressFormState } from './use-checkout-address-form-state'
import { useCheckoutAddressFormSync } from './use-checkout-address-form-sync'
import type { CheckoutSectionErrorKey } from '../checkout-requirements'

export type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form-sync'

type CheckoutAddressFormOptions = {
  cart: CheckoutOrder
  customerEmail: string | null
  savedAddresses: Array<CustomerAddress>
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  markShippingRatesStale: () => void
  scheduleAutoSaveAddress: () => void
  handleAddressBlur: () => void
}

export function useCheckoutAddressForm({
  cart,
  customerEmail,
  savedAddresses,
  clearCheckoutSectionError,
  markShippingRatesStale,
  scheduleAutoSaveAddress,
  handleAddressBlur,
}: CheckoutAddressFormOptions) {
  const state = useCheckoutAddressFormState({
    cart,
    customerEmail,
    savedAddresses,
  })
  const sync = useCheckoutAddressFormSync({
    billingFieldsRef: state.billingFieldsRef,
    billingForm: state.billingForm,
    billingMode: state.billingMode,
    clearCheckoutSectionError,
    deliveryFormRef: state.deliveryFormRef,
    form: state.form,
    handleAddressBlur,
    markShippingRatesStale,
    scheduleAutoSaveAddress,
    selectedSavedAddressId: state.selectedSavedAddressId,
    setSelectedSavedAddressId: state.setSelectedSavedAddressId,
  })

  return {
    ...state,
    ...sync,
    handleRegionBlur: handleAddressBlur,
  }
}
