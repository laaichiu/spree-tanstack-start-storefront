import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutAddress } from '@/lib/checkout/model/checkout'

export function getSelectedCheckoutSavedAddressId({
  savedAddresses,
  shippingAddress,
}: {
  savedAddresses: readonly CustomerAddress[]
  shippingAddress: CheckoutAddress | null | undefined
}) {
  const shippingAddressId = shippingAddress?.id ?? null

  if (!shippingAddressId) {
    return null
  }

  return savedAddresses.some((address) => address.id === shippingAddressId)
    ? shippingAddressId
    : null
}
