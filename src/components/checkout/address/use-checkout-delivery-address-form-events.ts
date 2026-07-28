import type { FormEvent, SyntheticEvent } from 'react'

import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'
import { isCheckoutShippingRateAddressFieldName } from '@/lib/checkout/utils/address/address-fields'
import {
  getCheckoutCountryChangeValues,
  getCheckoutStateAbbrChangeValues,
  getCheckoutStateNameChangeValues,
} from '@/lib/checkout/utils/address/address-region-change'

import {
  isCheckoutSavedAddressEvent,
  scheduleCheckoutBrowserAutofillSync,
} from './checkout-browser-autofill'
import type { CheckoutDeliveryAddressFormEventOptions } from './use-checkout-address-form-event-types'

export function useCheckoutDeliveryAddressFormEvents({
  clearCheckoutSectionError,
  form,
  handleAddressBlur,
  markShippingRatesStale,
  scheduleAutoSaveAddress,
  selectedSavedAddressId,
  setSelectedSavedAddressId,
  syncDeliveryFormValuesFromDom,
}: CheckoutDeliveryAddressFormEventOptions) {
  function handleSyncedDeliveryFields(
    changedFields: Array<keyof CheckoutAddressInput>,
  ) {
    if (changedFields.length === 0) {
      return
    }

    const changedShippingFields = changedFields.filter((fieldName) =>
      isCheckoutShippingRateAddressFieldName(fieldName),
    )

    if (changedShippingFields.length > 0) {
      if (selectedSavedAddressId) {
        setSelectedSavedAddressId(null)
      }

      markShippingRatesStale()
    }

    clearCheckoutSectionError('address')
    scheduleAutoSaveAddress()
  }

  function syncDeliveryFormValuesAfterBrowserAutofill(
    event: SyntheticEvent<HTMLElement>,
  ) {
    if (isCheckoutSavedAddressEvent(event)) {
      return
    }

    const syncFields = () => {
      const { changedFields } = syncDeliveryFormValuesFromDom({
        shouldValidate: true,
      })

      handleSyncedDeliveryFields(changedFields)
    }

    scheduleCheckoutBrowserAutofillSync(syncFields)
  }

  function handleFormAutoSaveEvent(event: FormEvent<HTMLFormElement>) {
    if (isCheckoutSavedAddressEvent(event)) {
      return
    }

    const { changedFields } = syncDeliveryFormValuesFromDom({
      shouldValidate: true,
    })
    const fieldName =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement
        ? event.target.name
        : null

    if (
      selectedSavedAddressId &&
      fieldName &&
      isCheckoutShippingRateAddressFieldName(fieldName)
    ) {
      setSelectedSavedAddressId(null)
    }

    if (isCheckoutShippingRateAddressFieldName(fieldName)) {
      markShippingRatesStale()
    }
    handleSyncedDeliveryFields(changedFields)
    scheduleAutoSaveAddress()
  }

  function handleFormBlur(event: FormEvent<HTMLFormElement>) {
    if (isCheckoutSavedAddressEvent(event)) {
      return
    }

    handleAddressBlur()
  }

  function handleCountryChange(value: string) {
    setSelectedSavedAddressId(null)
    markShippingRatesStale()
    const nextValues = getCheckoutCountryChangeValues(value)
    const shouldValidateCountry = Boolean(form.formState.errors.countryIso)
    const shouldValidateState = Boolean(
      form.formState.errors.stateAbbr || form.formState.errors.stateName,
    )

    form.setValue('countryIso', nextValues.countryIso, {
      shouldDirty: true,
      shouldValidate: shouldValidateCountry,
    })
    form.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    form.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    scheduleAutoSaveAddress()
  }

  function handleStateAbbrChange(value: string) {
    setSelectedSavedAddressId(null)
    markShippingRatesStale()
    const nextValues = getCheckoutStateAbbrChangeValues(value)
    const shouldValidateState = Boolean(
      form.formState.errors.stateAbbr || form.formState.errors.stateName,
    )

    form.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    form.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    scheduleAutoSaveAddress()
  }

  function handleStateNameChange(value: string) {
    setSelectedSavedAddressId(null)
    markShippingRatesStale()
    const nextValues = getCheckoutStateNameChangeValues(value)
    const shouldValidateState = Boolean(
      form.formState.errors.stateAbbr || form.formState.errors.stateName,
    )

    form.setValue('stateName', nextValues.stateName, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    form.setValue('stateAbbr', nextValues.stateAbbr, {
      shouldDirty: true,
      shouldValidate: shouldValidateState,
    })
    scheduleAutoSaveAddress()
  }

  return {
    handleCountryChange,
    handleFormAutoSaveEvent,
    handleFormBlur,
    handleStateAbbrChange,
    handleStateNameChange,
    handleSyncedDeliveryFields,
    syncDeliveryFormValuesAfterBrowserAutofill,
  }
}
