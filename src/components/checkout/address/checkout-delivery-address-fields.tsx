import { useMarket } from '@/components/layout/market-provider'

import { CheckoutPostalAddressFields } from './checkout-postal-address-fields'
import { CheckoutSavedAddresses } from './checkout-saved-addresses'
import type { CheckoutDeliveryAddressFieldsProps } from './checkout-delivery-section.types'

export function CheckoutDeliveryAddressFields({
  countryIso,
  deliveryForm,
  isCheckoutPending,
  isCheckoutSubmitting,
  labels,
  onCountryChange,
  onRegionBlur,
  onSelectSavedAddress,
  onStateAbbrChange,
  onStateNameChange,
  onUseManualAddress,
  savedAddresses,
  selectedSavedAddressId,
  stateAbbr,
  stateName,
}: CheckoutDeliveryAddressFieldsProps) {
  const { t } = useMarket()
  const showManualAddressForm =
    savedAddresses.length === 0 || selectedSavedAddressId === null

  return (
    <>
      <CheckoutSavedAddresses
        addresses={savedAddresses}
        disabled={isCheckoutPending || isCheckoutSubmitting}
        onSelectAddress={onSelectSavedAddress}
        onUseManualAddress={onUseManualAddress}
        selectedAddressId={selectedSavedAddressId}
      />

      {showManualAddressForm ? (
        <CheckoutPostalAddressFields
          form={deliveryForm}
          phoneLabel={t('checkout.phone')}
          phonePlaceholder={t('checkout.phone')}
          region={{
            countryId: 'checkout-delivery-country',
            countryIso,
            labels,
            onBlur: onRegionBlur,
            onCountryChange,
            onStateAbbrChange,
            onStateNameChange,
            stateAbbr,
            stateInputId: 'checkout-delivery-state-name',
            stateName,
            stateSelectId: 'checkout-delivery-state',
          }}
        />
      ) : null}
    </>
  )
}
