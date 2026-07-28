import type { MessageKey } from '@/lib/i18n/messages'

export function getCheckoutShippingMethodPlaceholderKey({
  areShippingRatesStale,
  isAddressComplete,
  isAddressPending,
  isShippingPending,
}: {
  areShippingRatesStale: boolean
  isAddressComplete: boolean
  isAddressPending: boolean
  isShippingPending: boolean
}): MessageKey {
  if (isAddressPending) {
    return 'checkout.savingDelivery'
  }

  if (isShippingPending) {
    return 'checkout.savingShippingMethod'
  }

  if (areShippingRatesStale && isAddressComplete) {
    return 'checkout.calculatingShippingMethods'
  }

  return 'checkout.shippingMethodPlaceholder'
}
