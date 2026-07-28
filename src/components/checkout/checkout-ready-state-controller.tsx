import type { ReactNode } from 'react'

import { CheckoutBillingAddressSection } from '@/components/checkout/address/checkout-billing-address-section'
import { CheckoutDeliverySection } from '@/components/checkout/address/checkout-delivery-section'
import { CheckoutConsentNotice } from '@/components/checkout/checkout-consent-notice'
import { getCheckoutSectionElementId } from '@/components/checkout/checkout-requirements'
import { CheckoutSubmitButton } from '@/components/checkout/completion/checkout-submit-button'
import { CheckoutExpressCheckout } from '@/components/checkout/express/checkout-express-checkout'
import { CheckoutPaymentSection } from '@/components/checkout/payment/checkout-payment-section'
import { CheckoutSummary } from '@/components/checkout/summary/checkout-summary'
import { useCheckoutReadyStateRuntime } from '@/components/checkout/use-checkout-ready-state'
import type { CheckoutReadyStateOptions } from '@/components/checkout/use-checkout-ready-state'

export type CheckoutReadyStateControllerValue = {
  checkoutError: string | null
  delivery: ReactNode
  express: ReactNode
  payment: ReactNode
  submit: ReactNode
  summary: ReactNode
}

type CheckoutReadyStateControllerProps = CheckoutReadyStateOptions & {
  children: (controller: CheckoutReadyStateControllerValue) => ReactNode
}

export function CheckoutReadyStateController({
  children,
  ...options
}: CheckoutReadyStateControllerProps) {
  const runtime = useCheckoutReadyStateRuntime(options)
  const {
    accountLoginHref,
    address,
    authenticatedCustomerEmail,
    cart,
    checkoutError,
    deliveryRegionLabels,
    handleSubmitPayment,
    hasSessionPaymentMethod,
    isCheckoutSubmitting,
    isMobileSummaryOpen,
    isPaymentBusy,
    isPaymentSubmitQueued,
    isSubmitDisabled,
    onMobileSummaryToggle,
    onPaymentBusyChange,
    onPaymentReadyChange,
    onPaymentSetupPendingChange,
    paymentSectionRef,
    savedAddresses,
    savedPaymentCards,
    sectionErrors,
  } = runtime
  const visibleCheckoutError =
    checkoutError &&
    !Object.values(sectionErrors).some((errors) =>
      errors.includes(checkoutError),
    )
      ? checkoutError
      : null
  const {
    form: addressForm,
    isCheckoutPending,
    persistence,
    shipping,
  } = address
  const {
    areShippingMethodsUpdating,
    areShippingRatesStale,
    handleSelectShippingRate,
    hasCurrentShippingSelection,
    selectedShippingRateId,
    shippingMethodPlaceholder,
  } = shipping
  const { handleSaveAddress, persistCheckoutSavedAddress } = persistence
  const {
    billingCountryIso,
    billingFieldsRef,
    billingForm,
    billingMode,
    billingStateAbbr,
    billingStateName,
    countryIso,
    deliveryFormRef,
    form,
    handleBillingCountryChange,
    handleBillingStateAbbrChange,
    handleBillingStateNameChange,
    handleCountryChange,
    handleFormAutoSaveEvent,
    handleFormBlur,
    handleRegionBlur,
    handleStateAbbrChange,
    handleStateNameChange,
    selectedSavedAddressId,
    stateAbbr,
    stateName,
    syncBillingFormValuesAfterBrowserAutofill,
    syncDeliveryFormValuesAfterBrowserAutofill,
    setBillingMode,
    setSelectedSavedAddressId,
  } = addressForm

  return children({
    checkoutError: visibleCheckoutError,
    delivery: (
      <CheckoutDeliverySection
        address={{
          countryIso,
          deliveryForm: form,
          isCheckoutPending,
          isCheckoutSubmitting,
          labels: deliveryRegionLabels,
          onCountryChange: handleCountryChange,
          onRegionBlur: handleRegionBlur,
          onSelectSavedAddress: (addressValue) =>
            void persistCheckoutSavedAddress(addressValue),
          onStateAbbrChange: handleStateAbbrChange,
          onStateNameChange: handleStateNameChange,
          onUseManualAddress: () => setSelectedSavedAddressId(null),
          savedAddresses,
          selectedSavedAddressId,
          stateAbbr,
          stateName,
        }}
        contact={{
          accountLoginHref,
          addressErrors: sectionErrors.address,
          authenticatedCustomerEmail,
          deliveryForm: form,
        }}
        formRef={deliveryFormRef}
        onBlurCapture={handleFormBlur}
        onChangeCapture={handleFormAutoSaveEvent}
        onClickCapture={syncDeliveryFormValuesAfterBrowserAutofill}
        onFocusCapture={syncDeliveryFormValuesAfterBrowserAutofill}
        onInputCapture={handleFormAutoSaveEvent}
        onPointerDownCapture={syncDeliveryFormValuesAfterBrowserAutofill}
        onSubmit={(event) => void form.handleSubmit(handleSaveAddress)(event)}
        shipping={{
          onSelectShippingRate: (rate) => void handleSelectShippingRate(rate),
          selectedShippingRateId,
          shippingDisabled:
            isCheckoutPending || isCheckoutSubmitting || areShippingRatesStale,
          shippingErrors: sectionErrors.shipping,
          shippingMethodsUpdating: areShippingMethodsUpdating,
          shippingPlaceholder: shippingMethodPlaceholder,
          shippingRates: cart.shippingRates,
        }}
      />
    ),
    express: <CheckoutExpressCheckout cart={cart} />,
    payment: (
      <CheckoutPaymentSection
        billingAddressSection={
          <CheckoutBillingAddressSection
            billingCountryIso={billingCountryIso}
            billingForm={billingForm}
            billingMode={billingMode}
            billingStateAbbr={billingStateAbbr}
            billingStateName={billingStateName}
            disabled={
              isCheckoutPending || isCheckoutSubmitting || isPaymentBusy
            }
            fieldsRef={billingFieldsRef}
            labels={deliveryRegionLabels}
            onAutofillSync={syncBillingFormValuesAfterBrowserAutofill}
            onBillingCountryChange={handleBillingCountryChange}
            onBillingStateAbbrChange={handleBillingStateAbbrChange}
            onBillingStateNameChange={handleBillingStateNameChange}
            onModeChange={setBillingMode}
          />
        }
        cart={cart}
        controlsDisabled={isCheckoutPending || isCheckoutSubmitting}
        errors={sectionErrors.payment}
        id={getCheckoutSectionElementId('payment')}
        onBusyChange={onPaymentBusyChange}
        onReadyChange={onPaymentReadyChange}
        onSetupPendingChange={onPaymentSetupPendingChange}
        ref={paymentSectionRef}
        savedPaymentCards={savedPaymentCards}
        shippingReady={hasCurrentShippingSelection}
      />
    ),
    submit: (
      <>
        <CheckoutConsentNotice />
        <CheckoutSubmitButton
          amountDueAmount={cart.amountDue.amount}
          disabled={isSubmitDisabled}
          hasSessionPaymentMethod={hasSessionPaymentMethod}
          isPending={
            isCheckoutSubmitting || isPaymentBusy || isPaymentSubmitQueued
          }
          onSubmit={() => void handleSubmitPayment()}
        />
      </>
    ),
    summary: (
      <CheckoutSummary
        cart={cart}
        isMobileOpen={isMobileSummaryOpen}
        onMobileToggle={onMobileSummaryToggle}
      />
    ),
  })
}
