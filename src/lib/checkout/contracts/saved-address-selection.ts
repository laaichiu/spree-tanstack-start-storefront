import type { CustomerAddress } from '../../account/contracts'
import type { CheckoutAddress } from './checkout'

export function getSelectedCheckoutSavedAddressId({
  savedAddresses,
  shippingAddress,
}: {
  savedAddresses: readonly CustomerAddress[]
  shippingAddress: CheckoutAddress | null | undefined
}): string | null {
  const shippingAddressId = shippingAddress?.id ?? null

  if (!shippingAddressId) {
    return null
  }

  return savedAddresses.some((address) => address.id === shippingAddressId)
    ? shippingAddressId
    : null
}

export function shouldShowCheckoutManualAddressForm({
  savedAddresses,
  selectedSavedAddressId,
}: {
  savedAddresses: readonly CustomerAddress[]
  selectedSavedAddressId: string | null
}): boolean {
  return savedAddresses.length === 0 || selectedSavedAddressId === null
}
