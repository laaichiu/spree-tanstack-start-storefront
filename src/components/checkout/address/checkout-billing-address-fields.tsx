import { useMarket } from '@/components/layout/market-provider'
import { CheckoutBillingAddressFieldsView } from '@/components/checkout/checkout-billing-address-fields-view'

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
    <CheckoutBillingAddressFieldsView
      slots={{
        fields: (
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
        ),
      }}
      fieldsRef={fieldsRef}
      onAutofillSync={onAutofillSync}
    />
  )
}
