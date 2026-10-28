import type { CheckoutAddressInput } from '@/lib/checkout/contracts'
import {
  getCheckoutAddressFormDefaults,
  getCheckoutAddressFormDefaultsFromCustomerAddress,
  getCheckoutAddressSignature,
  getCheckoutBillingAddressFormDefaults,
} from '@/lib/checkout/contracts'
import { checkoutAddressSchema } from '../../validation/address'

export {
  getCheckoutAddressFormDefaults,
  getCheckoutAddressFormDefaultsFromCustomerAddress,
  getCheckoutAddressSignature,
  getCheckoutBillingAddressFormDefaults,
}

export function getInitialSavedAddressSignature(address: CheckoutAddressInput) {
  const result = checkoutAddressSchema.safeParse(address)

  return result.success ? getCheckoutAddressSignature(result.data) : null
}
