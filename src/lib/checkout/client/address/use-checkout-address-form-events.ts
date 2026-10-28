import type { CheckoutAddressFormEventsOptions } from './use-checkout-address-form-event-types'
import { useCheckoutBillingAddressFormEvents } from './use-checkout-billing-address-form-events'
import { useCheckoutDeliveryAddressFormEvents } from './use-checkout-delivery-address-form-events'

export function useCheckoutAddressFormEvents(
  options: CheckoutAddressFormEventsOptions,
) {
  const delivery = useCheckoutDeliveryAddressFormEvents(options)
  const billing = useCheckoutBillingAddressFormEvents(options)

  return {
    ...billing,
    ...delivery,
  }
}
