import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import {
  checkoutAddressSchema,
  checkoutBillingAddressSchema,
} from '../../validation/address'

import type {
  CheckoutBillingAddressFormSyncResult,
  CheckoutAddressFormSyncResult,
} from '../use-checkout-address-controller'

export type CheckoutSubmitFormValidationOptions = {
  form: Pick<UseFormReturn<CheckoutAddressInput>, 'trigger'>
  billingForm: Pick<UseFormReturn<CheckoutBillingAddressInput>, 'trigger'>
  billingMode: CheckoutBillingAddressMode
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
}

export type CheckoutSubmitFormValidationResult =
  | {
      type: 'invalid'
    }
  | {
      address: CheckoutAddressInput
      type: 'valid'
    }

export async function validateCheckoutSubmitForms({
  billingForm,
  billingMode,
  form,
  handleSyncedBillingFields,
  scrollToCheckoutSection,
  syncBillingFormValuesFromDom,
  syncDeliveryFormValuesFromDom,
}: CheckoutSubmitFormValidationOptions): Promise<CheckoutSubmitFormValidationResult> {
  const { values: formValues } = syncDeliveryFormValuesFromDom({
    shouldValidate: true,
  })
  const syncedBillingAddress =
    billingMode === 'different'
      ? syncBillingFormValuesFromDom({ shouldValidate: true })
      : null

  if (syncedBillingAddress) {
    handleSyncedBillingFields(syncedBillingAddress.changedFields)
  }

  const parsedAddress = checkoutAddressSchema.safeParse(formValues)
  const parsedBillingAddress =
    syncedBillingAddress !== null
      ? checkoutBillingAddressSchema.safeParse(syncedBillingAddress.values)
      : null

  const validatedAddress = parsedAddress.success ? parsedAddress.data : null

  if (!validatedAddress || parsedBillingAddress?.success === false) {
    await Promise.all([
      !validatedAddress ? form.trigger() : Promise.resolve(true),
      parsedBillingAddress?.success === false
        ? billingForm.trigger()
        : Promise.resolve(true),
    ])

    scrollToCheckoutSection(validatedAddress ? 'payment' : 'address')
    return { type: 'invalid' }
  }

  return {
    address: validatedAddress,
    type: 'valid',
  }
}
