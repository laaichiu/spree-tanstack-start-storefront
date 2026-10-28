import type { CheckoutPostalAddressLayoutSlots } from '../contracts/checkout'

export type { CheckoutPostalAddressLayoutSlots } from '../contracts/checkout'

export function CheckoutPostalAddressLayoutView({
  slots,
}: {
  slots: CheckoutPostalAddressLayoutSlots
}) {
  return (
    <>
      {slots.country}
      <div className="grid gap-4 sm:grid-cols-2">
        {slots.firstName}
        {slots.lastName}
      </div>
      {slots.company}
      {slots.address1}
      {slots.address2}
      <div className="grid gap-4 sm:grid-cols-3">
        {slots.city}
        {slots.state}
        {slots.postalCode}
      </div>
      {slots.phone}
    </>
  )
}
