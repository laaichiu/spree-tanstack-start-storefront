import type { CheckoutBillingAddressInput } from '@/lib/checkout/validation/address'
import {
  getCheckoutCountryChangeValues,
  getCheckoutStateAbbrChangeValues,
  getCheckoutStateNameChangeValues,
} from '@/lib/checkout/utils/address/address-region-change'

import { scheduleCheckoutBrowserAutofillSync } from './checkout-browser-autofill'
import type { CheckoutBillingAddressFormEventOptions } from './use-checkout-address-form-event-types'

export function useCheckoutBillingAddressFormEvents({
  billingForm,
  billingMode,
  clearCheckoutSectionError,
  syncBillingFormValuesFromDom,
}: CheckoutBillingAddressFormEventOptions) {
  function handleSyncedBillingFields(
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) {
    if (changedFields.length > 0) {
      clearCheckoutSectionError('payment')
    }
  }

  function syncBillingFormValuesAfterBrowserAutofill() {
    if (billingMode !== 'different') {
      return
    }

    const syncFields = () => {
      const { changedFields } = syncBillingFormValuesFromDom({
        shouldValidate: true,
      })

      handleSyncedBillingFields(changedFields)
    }

    scheduleCheckoutBrowserAutofillSync(syncFields)
  }

  function handleBillingCountryChange(value: string) {
    clearCheckoutSectionError('payment')
    const nextValues = getCheckoutCountryChangeValues(value)
    const shouldValidateCountry = Boolean(
      billingForm.formState.errors.countryIso,
    )
    const shouldValidateState = Boolean(
      billingForm.formState.errors.stateAbbr ||
      billingForm.formState.errors.stateName,
    )

    billingForm.setValue('countryIso', nextValues.countryIso, {
      shouldDirty: true,
      shouldValidate: shouldValidateCountry,
    })
    billingForm.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    billingForm.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
  }

  function handleBillingStateAbbrChange(value: string) {
    clearCheckoutSectionError('payment')
    const nextValues = getCheckoutStateAbbrChangeValues(value)
    const shouldValidateState = Boolean(
      billingForm.formState.errors.stateAbbr ||
      billingForm.formState.errors.stateName,
    )

    billingForm.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    billingForm.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
  }

  function handleBillingStateNameChange(value: string) {
    clearCheckoutSectionError('payment')
    const nextValues = getCheckoutStateNameChangeValues(value)
    const shouldValidateState = Boolean(
      billingForm.formState.errors.stateAbbr ||
      billingForm.formState.errors.stateName,
    )

    billingForm.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    billingForm.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
  }

  return {
    handleBillingCountryChange,
    handleBillingStateAbbrChange,
    handleBillingStateNameChange,
    handleSyncedBillingFields,
    syncBillingFormValuesAfterBrowserAutofill,
  }
}
