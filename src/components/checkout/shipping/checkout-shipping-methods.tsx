import type { CartShippingRate } from '@/lib/cart/contracts'
import {
  findCheckoutShippingRateByIdentity,
  getCheckoutShippingRateIdentity,
  getSelectedCheckoutShippingRateById,
  shouldShowCheckoutShippingMethodsPlaceholder,
} from '@/lib/checkout/contracts'
import { getCheckoutShippingMethodPresentations } from '@/components/checkout/shipping/checkout-shipping-method-display'
import { CheckoutShippingMethodsView } from '@/components/checkout/checkout-shipping-methods-view'

export function CheckoutShippingMethods({
  disabled,
  isUpdating = false,
  locale,
  onSelect,
  placeholder,
  rates,
  selectedRateId,
}: {
  disabled: boolean
  isUpdating?: boolean
  locale: string
  onSelect: (rate: CartShippingRate) => void
  placeholder: string
  rates: CartShippingRate[]
  selectedRateId: string
}) {
  const showPlaceholder = shouldShowCheckoutShippingMethodsPlaceholder({
    hasRates: rates.length > 0,
    isUpdating,
  })
  const selectedRate = getSelectedCheckoutShippingRateById({
    rates,
    selectedRateId,
  })
  const model = showPlaceholder
    ? ({ placeholder, status: 'placeholder' } as const)
    : {
        disabled,
        methods: getCheckoutShippingMethodPresentations({ locale, rates }),
        selectedMethodId: selectedRate
          ? getCheckoutShippingRateIdentity(selectedRate)
          : null,
        status: 'methods' as const,
      }

  return (
    <CheckoutShippingMethodsView
      model={model}
      onSelect={(identity) => {
        const nextRate = findCheckoutShippingRateByIdentity({
          identity,
          rates,
        })

        if (nextRate) {
          onSelect(nextRate)
        }
      }}
    />
  )
}
