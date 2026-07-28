import { useMarket } from '@/components/layout/market-provider'

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
  const { t } = useMarket()

  return (
    <div className="space-y-5 pt-3">
      <div className="scroll-mt-8" id={getCheckoutSectionElementId('shipping')}>
        <h3 className="text-xl leading-6 font-normal text-foreground">
          {t('checkout.shippingMethod')}
        </h3>
        {shippingErrors?.length ? (
          <div className="mt-5 border border-destructive bg-muted px-4 py-3">
            {shippingErrors.map((error, index) => (
              <p
                className="text-sm leading-6 text-destructive"
                key={`${error}:${index}`}
              >
                {error}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <CheckoutShippingMethods
        disabled={shippingDisabled}
        isUpdating={shippingMethodsUpdating}
        onSelect={onSelectShippingRate}
        placeholder={shippingPlaceholder}
        rates={shippingRates}
        selectedRateId={selectedShippingRateId}
      />
    </div>
  )
}
