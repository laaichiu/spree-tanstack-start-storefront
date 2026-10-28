import { useMarket } from '@/components/layout/market-provider'
import { CheckoutShippingMethodSectionView } from '@/components/checkout/checkout-shipping-method-section-view'

import { getCheckoutSectionElementId } from '../checkout-requirements'
import { CheckoutShippingMethods } from './checkout-shipping-methods'
import type { CheckoutShippingMethodSectionProps } from '../address/checkout-delivery-section.types'

export function CheckoutShippingMethodSection({
  onSelectShippingRate,
  selectedShippingRateId,
  shippingDisabled,
  shippingErrors,
  shippingMethodsUpdating,
  shippingPlaceholder,
  shippingRates,
}: CheckoutShippingMethodSectionProps) {
  const { market, t } = useMarket()

  return (
    <CheckoutShippingMethodSectionView
      model={{
        errors: shippingErrors,
        id: getCheckoutSectionElementId('shipping'),
        title: t('checkout.shippingMethod'),
      }}
      methods={
        <CheckoutShippingMethods
          disabled={shippingDisabled}
          isUpdating={shippingMethodsUpdating}
          locale={market.locale}
          onSelect={onSelectShippingRate}
          placeholder={shippingPlaceholder}
          rates={shippingRates}
          selectedRateId={selectedShippingRateId}
        />
      }
    />
  )
}
