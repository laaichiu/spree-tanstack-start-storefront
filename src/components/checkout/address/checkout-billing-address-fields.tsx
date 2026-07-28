import { useMarket } from '@/components/layout/market-provider'

import { CheckoutPostalAddressFields } from './checkout-postal-address-fields'
import type { CheckoutBillingAddressFieldsProps } from './checkout-billing-address-section.types'

export function CheckoutBillingAddressFields({
  billingCountryIso,
  billingForm,
  billingStateAbbr,
  billingStateName,
  disabled,
  fieldsRef,
  labels,
  onAutofillSync,
  onBillingCountryChange,
  onBillingStateAbbrChange,
  onBillingStateNameChange,
}: CheckoutBillingAddressFieldsProps) {
  const { t } = useMarket()

  return (
    <div
      className="-mt-4 space-y-4 border-x border-b border-border px-4 pt-5 pb-4"
      id="checkout-billing-address-fields"
      onClickCapture={onAutofillSync}
      onFocusCapture={onAutofillSync}
      onPointerDownCapture={onAutofillSync}
      ref={fieldsRef}
    >
      <CheckoutPostalAddressFields
        disabled={disabled}
        form={billingForm}
        phoneLabel={t('checkout.phoneOptional')}
        phonePlaceholder={t('checkout.phoneOptional')}
        region={{
          countryId: 'checkout-billing-country',
          countryIso: billingCountryIso,
          labels,
          onCountryChange: onBillingCountryChange,
          onStateAbbrChange: onBillingStateAbbrChange,
          onStateNameChange: onBillingStateNameChange,
          stateAbbr: billingStateAbbr,
          stateInputId: 'checkout-billing-state-name',
          stateName: billingStateName,
          stateSelectId: 'checkout-billing-state',
        }}
      />
    </div>
  )
}
