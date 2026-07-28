import { useCallback } from 'react'

import { useMarket } from '@/components/layout/market-provider'

import { prepareCheckoutPaymentSubmission } from './checkout-submit-preparation-flow'
import type {
  CheckoutSubmitPreparationOptions,
  CheckoutSubmitPreparationResult,
} from './checkout-submit-preparation-flow'

export type { CheckoutSubmitPreparationResult } from './checkout-submit-preparation-flow'

type CheckoutSubmitPreparationHookOptions = Omit<
  CheckoutSubmitPreparationOptions,
  't'
>

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
}: CheckoutSubmitPreparationHookOptions) {
  const { t } = useMarket()

  return useCallback(
    (): Promise<CheckoutSubmitPreparationResult> =>
      prepareCheckoutPaymentSubmission({
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
