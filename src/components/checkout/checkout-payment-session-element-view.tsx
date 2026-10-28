import type { CheckoutPaymentSessionElementSlots } from '../contracts/checkout'

export type { CheckoutPaymentSessionElementSlots } from '../contracts/checkout'

export function CheckoutPaymentSessionElementView({
  isLoading,
  slots,
}: {
  isLoading: boolean
  slots: CheckoutPaymentSessionElementSlots
}) {
  return (
    <div className="relative">
      {isLoading && slots.loading}
      <div
        aria-hidden={isLoading}
        className={
          isLoading
            ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0'
            : undefined
        }
      >
        {slots.payment}
      </div>
    </div>
  )
}
