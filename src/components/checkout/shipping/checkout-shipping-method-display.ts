import type { CartShippingRate } from '@/lib/cart/contracts'
import { getCheckoutShippingRateIdentity } from '@/lib/checkout/contracts'
import { formatMoney } from '@/components/shared/money-display'

export type CheckoutShippingMethodPresentation = {
  identity: string
  id: string
  isSelected: boolean
  label: string
  price: string
}

export function getCheckoutShippingMethodPresentations({
  locale,
  rates,
}: {
  locale: string
  rates: readonly CartShippingRate[]
}): CheckoutShippingMethodPresentation[] {
  return rates.map((rate) => ({
    identity: getCheckoutShippingRateIdentity(rate),
    id: rate.id,
    isSelected: rate.selected,
    label: rate.name,
    price: formatMoney(rate.displayPrice, locale),
  }))
}
