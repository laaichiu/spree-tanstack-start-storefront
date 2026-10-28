import { useMarket } from '@/components/layout/market-provider'
import { CheckoutBillingAddressSectionView } from '@/components/checkout/checkout-billing-address-section-view'

import { CheckoutBillingAddressFields } from './checkout-billing-address-fields'
import type { CheckoutBillingAddressSectionProps } from './checkout-billing-address-section.types'

export function CheckoutBillingAddressSection({
  billingCountryIso,
  billingForm,
  billingMode,
  billingStateAbbr,
  billingStateName,
  disabled,
  fieldsRef,
  labels,
  onAutofillSync,
  onBillingCountryChange,
  onBillingStateAbbrChange,
  onBillingStateNameChange,
  onModeChange,
}: CheckoutBillingAddressSectionProps) {
  const { t } = useMarket()

  return (
    <CheckoutBillingAddressSectionView
      model={{
        billingMode,
        differentLabel: t('checkout.useDifferentBillingAddress'),
        disabled,
        sameLabel: t('checkout.sameAsShippingAddress'),
        title: t('checkout.billingAddress'),
      }}
      onModeChange={onModeChange}
      slots={{
        fields: (
          <CheckoutBillingAddressFields
            billingCountryIso={billingCountryIso}
            billingForm={billingForm}
            billingStateAbbr={billingStateAbbr}
            billingStateName={billingStateName}
            disabled={disabled}
            fieldsRef={fieldsRef}
            labels={labels}
            onAutofillSync={onAutofillSync}
            onBillingCountryChange={onBillingCountryChange}
            onBillingStateAbbrChange={onBillingStateAbbrChange}
            onBillingStateNameChange={onBillingStateNameChange}
          />
        ),
      }}
    />
  )
}
