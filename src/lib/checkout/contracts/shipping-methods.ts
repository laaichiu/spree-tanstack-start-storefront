export function shouldShowCheckoutShippingMethodsPlaceholder({
  hasRates,
  isUpdating,
}: {
  hasRates: boolean
  isUpdating: boolean
}) {
  return isUpdating || !hasRates
}
