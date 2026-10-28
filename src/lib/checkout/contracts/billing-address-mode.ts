import type { CheckoutAddress } from './checkout'

export type CheckoutBillingAddressMode = 'same' | 'different'

export function getCheckoutBillingAddressMode({
  billingAddress,
  shippingMatchesBillingAddress,
}: {
  billingAddress: CheckoutAddress | null | undefined
  shippingMatchesBillingAddress: boolean
}): CheckoutBillingAddressMode {
  return billingAddress && !shippingMatchesBillingAddress ? 'different' : 'same'
}
