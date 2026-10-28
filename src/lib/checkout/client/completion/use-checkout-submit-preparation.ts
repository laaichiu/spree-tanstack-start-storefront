import { useCallback } from 'react'

import { prepareCheckoutPaymentSubmission } from '../../utils/completion/checkout-submit-preparation'
import type {
  CheckoutSubmitPreparationOptions,
  CheckoutSubmitPreparationResult,
} from '../../utils/completion/checkout-submit-preparation'
import type { MessageKey } from '../../../i18n/messages'
import { validateCheckoutSubmitForms } from './checkout-submit-form-validation'
import type { CheckoutSubmitFormValidationOptions } from './checkout-submit-form-validation'

export type { CheckoutSubmitPreparationResult } from '../../utils/completion/checkout-submit-preparation'

type CheckoutSubmitPreparationHookOptions = Omit<
  CheckoutSubmitPreparationOptions,
  't' | 'validateForms'
> &
  CheckoutSubmitFormValidationOptions & {
    t: (key: MessageKey) => string
  }

export function useCheckoutSubmitPreparation({
  cart,
  form,
  billingForm,
  billingMode,
  selectedShippingRate,
  paymentStateKey,
  handleSyncedBillingFields,
  syncDeliveryFormValuesFromDom,
  syncBillingFormValuesFromDom,
  persistCheckoutAddress,
  persistBillingAddress,
  ensureSelectedCheckoutShippingRate,
  setCheckoutError,
  setCheckoutSectionErrorsAndScroll,
  setSingleCheckoutSectionError,
  scrollToCheckoutSection,
  t,
}: CheckoutSubmitPreparationHookOptions) {
  return useCallback(
    (isCurrent: () => boolean): Promise<CheckoutSubmitPreparationResult> =>
      prepareCheckoutPaymentSubmission({
        cart,
        ensureSelectedCheckoutShippingRate,
        paymentStateKey,
        persistBillingAddress,
        persistCheckoutAddress,
        selectedShippingRate,
        setCheckoutError,
        setCheckoutSectionErrorsAndScroll,
        setSingleCheckoutSectionError,
        t,
        isCurrent,
        validateForms: () =>
          validateCheckoutSubmitForms({
            billingForm,
            billingMode,
            form,
            handleSyncedBillingFields,
            scrollToCheckoutSection,
            syncBillingFormValuesFromDom,
            syncDeliveryFormValuesFromDom,
          }),
      }),
    [
      billingForm,
      billingMode,
      cart,
      ensureSelectedCheckoutShippingRate,
      form,
      handleSyncedBillingFields,
      paymentStateKey,
      persistBillingAddress,
      persistCheckoutAddress,
      scrollToCheckoutSection,
      selectedShippingRate,
      setCheckoutError,
      setCheckoutSectionErrorsAndScroll,
      setSingleCheckoutSectionError,
      syncBillingFormValuesFromDom,
      syncDeliveryFormValuesFromDom,
      t,
    ],
  )
}
