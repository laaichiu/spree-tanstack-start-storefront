import type { RefObject } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import {
  readCheckoutAddressFormValues,
  readCheckoutBillingAddressFormValues,
} from './checkout-form'
import { getCheckoutAddressFormSyncPlan } from '@/lib/checkout/utils/address/address-form-sync'
import {
  CHECKOUT_ADDRESS_FIELD_NAMES,
  CHECKOUT_BILLING_ADDRESS_FIELD_NAMES,
} from '@/lib/checkout/utils/address/address-fields'

export type CheckoutAddressFormSyncResult = {
  changedFields: Array<keyof CheckoutAddressInput>
  values: CheckoutAddressInput
}

export type CheckoutBillingAddressFormSyncResult = {
  changedFields: Array<keyof CheckoutBillingAddressInput>
  values: CheckoutBillingAddressInput
}

type CheckoutAddressFormDomSyncOptions = {
  billingFieldsRef: RefObject<HTMLDivElement | null>
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  deliveryFormRef: RefObject<HTMLFormElement | null>
  form: UseFormReturn<CheckoutAddressInput>
}

export function useCheckoutAddressFormDomSync({
  billingFieldsRef,
  billingForm,
  deliveryFormRef,
  form,
}: CheckoutAddressFormDomSyncOptions) {
  function syncDeliveryFormValuesFromDom({
    shouldValidate = false,
  }: { shouldValidate?: boolean } = {}): CheckoutAddressFormSyncResult {
    const currentValues = form.getValues()
    const values = deliveryFormRef.current
      ? readCheckoutAddressFormValues(deliveryFormRef.current, currentValues)
      : currentValues
    const currentErrors = form.formState.errors
    const syncPlan = getCheckoutAddressFormSyncPlan({
      currentErrorFields: CHECKOUT_ADDRESS_FIELD_NAMES.filter(
        (fieldName) => currentErrors[fieldName],
      ),
      currentValues,
      fieldNames: CHECKOUT_ADDRESS_FIELD_NAMES,
      nextValues: values,
      shouldValidate,
    })

    for (const fieldName of syncPlan.changedFields) {
      form.setValue(fieldName, values[fieldName], {
        shouldDirty: true,
        shouldValidate: false,
      })
    }

    if (shouldValidate && syncPlan.fieldsToValidate.length > 0) {
      if (syncPlan.fieldsToClear.length > 0) {
        form.clearErrors(syncPlan.fieldsToClear)
      }

      void form.trigger(syncPlan.fieldsToValidate)
    }

    return {
      changedFields: syncPlan.changedFields,
      values,
    }
  }

  function syncBillingFormValuesFromDom({
    shouldValidate = false,
  }: { shouldValidate?: boolean } = {}): CheckoutBillingAddressFormSyncResult {
    const currentValues = billingForm.getValues()
    const values = billingFieldsRef.current
      ? readCheckoutBillingAddressFormValues(
          billingFieldsRef.current,
          currentValues,
        )
      : currentValues
    const currentErrors = billingForm.formState.errors
    const syncPlan = getCheckoutAddressFormSyncPlan({
      currentErrorFields: CHECKOUT_BILLING_ADDRESS_FIELD_NAMES.filter(
        (fieldName) => currentErrors[fieldName],
      ),
      currentValues,
      fieldNames: CHECKOUT_BILLING_ADDRESS_FIELD_NAMES,
      nextValues: values,
      shouldValidate,
    })

    for (const fieldName of syncPlan.changedFields) {
      billingForm.setValue(fieldName, values[fieldName], {
        shouldDirty: true,
        shouldValidate: false,
      })
    }

    if (shouldValidate && syncPlan.fieldsToValidate.length > 0) {
      if (syncPlan.fieldsToClear.length > 0) {
        billingForm.clearErrors(syncPlan.fieldsToClear)
      }

      void billingForm.trigger(syncPlan.fieldsToValidate)
    }

    return {
      changedFields: syncPlan.changedFields,
      values,
    }
  }

  return {
    syncBillingFormValuesFromDom,
    syncDeliveryFormValuesFromDom,
  }
}
