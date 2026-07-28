import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import type { BillingAddressMode } from './checkout-form'
import type { CheckoutSectionErrorKey } from '../checkout-requirements'
import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form-dom-sync'

export type CheckoutAddressFormEventsOptions = {
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: BillingAddressMode
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  form: UseFormReturn<CheckoutAddressInput>
  handleAddressBlur: () => void
  markShippingRatesStale: () => void
  scheduleAutoSaveAddress: () => void
  selectedSavedAddressId: string | null
  setSelectedSavedAddressId: (addressId: string | null) => void
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
}

export type CheckoutDeliveryAddressFormEventOptions = Pick<
  CheckoutAddressFormEventsOptions,
  | 'clearCheckoutSectionError'
  | 'form'
  | 'handleAddressBlur'
  | 'markShippingRatesStale'
  | 'scheduleAutoSaveAddress'
  | 'selectedSavedAddressId'
  | 'setSelectedSavedAddressId'
  | 'syncDeliveryFormValuesFromDom'
>

export type CheckoutBillingAddressFormEventOptions = Pick<
  CheckoutAddressFormEventsOptions,
  | 'billingForm'
  | 'billingMode'
  | 'clearCheckoutSectionError'
  | 'syncBillingFormValuesFromDom'
>
