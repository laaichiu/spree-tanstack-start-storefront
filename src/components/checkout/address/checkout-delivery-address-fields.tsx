import { useMarket } from '@/components/layout/market-provider'
import { getCheckoutSavedAddressDisplays } from '@/components/checkout/address/checkout-saved-address-display'
import { shouldShowCheckoutManualAddressForm } from '@/lib/checkout/contracts'
import { CheckoutDeliveryAddressFieldsView } from '@/components/checkout/checkout-delivery-address-fields-view'
import { CheckoutSavedAddressesView } from '@/components/checkout/checkout-saved-addresses-view'

import { CheckoutPostalAddressFields } from './checkout-postal-address-fields'
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
  const showManualAddressForm = shouldShowCheckoutManualAddressForm({
    savedAddresses,
    selectedSavedAddressId,
  })

  return (
    <CheckoutDeliveryAddressFieldsView
      model={{ showManualAddressForm }}
      slots={{
        manual: (
          <CheckoutPostalAddressFields
            disabled={isCheckoutPending || isCheckoutSubmitting}
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
        ),
        saved: (
          <CheckoutSavedAddressesView
            actions={{
              selectAddress: (addressId) => {
                const address = savedAddresses.find(
                  (candidate) => candidate.id === addressId,
                )

                if (address) {
                  onSelectSavedAddress(address)
                }
              },
              useManualAddress: onUseManualAddress,
            }}
            model={{
              addresses: getCheckoutSavedAddressDisplays(
                savedAddresses,
                t('checkout.savedAddress'),
              ),
              disabled: isCheckoutPending || isCheckoutSubmitting,
              manualAddressLabel: t('checkout.useDifferentDeliveryAddress'),
              selectedAddressId: selectedSavedAddressId,
              title: t('checkout.savedAddresses'),
            }}
          />
        ),
      }}
    />
  )
}
